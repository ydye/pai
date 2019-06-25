import json
import yaml
import os
from typing import Union
from copy import deepcopy

from openpaisdk import __cluster_config_file__, __jobs_cache__, __logger__, __sdk_branch__, __cache__
from openpaisdk import get_install_uri
from openpaisdk.cli_arguments import Namespace, cli_add_arguments, not_not, get_args
from openpaisdk.io_utils import from_file, to_file, get_defaults
from openpaisdk.utils import OrganizedList as ol
from openpaisdk.cluster import ClusterList

__protocol_filename__ = "job_protocol.yaml"
__config_filename__ = "job_config.json"
__protocol_unit_types__ = ["job", "data", "script", "dockerimage", "output"]


class ProtocolUnit:

    @staticmethod
    def validate(u: dict):
        assert u["protocolVersion"] in ["1", "2", 1, 2], "invalid protocolVersion (%s)" % u["protocolVersion"]
        assert u["type"] in __protocol_unit_types__, "invalid type (%s)" % u["type"]
        assert u["name"], "invalid name"
        if u["type"] == "dockerimage":
            assert u["uri"], "dockerimage must have a uri"

class TaskRole:

    @staticmethod
    def validate(t: dict):
        assert t["dockerImage"], "unknown dockerImage"
        assert t["resourcePerInstance"]["cpu"] > 0, "invalid cpu number (%d)" % t["resourcePerInstance"]["cpu"]
        assert t["resourcePerInstance"]["gpu"] >= 0, "invalid gpu number (%d)" % t["resourcePerInstance"]["gpu"]
        assert t["resourcePerInstance"]["memoryMB"] > 0, "invalid memoryMB number (%d)" % t["resourcePerInstance"]["memoryMB"]
        for label, port in t["resourcePerInstance"].get("ports", {}).items():
            assert port >= 0, "invalid port (%s : %d)" % (label, port)
        assert isinstance(t["commands"], list) and t["commands"], "empty commands"


class Deployment:

    @staticmethod
    def validate(d: dict, task_role_names: list):
        assert d["name"], "deployment should have a name"
        for t, c in d["taskRoles"].items():
            assert t in task_role_names, "invalid taskrole name (%s)" % (t)
            assert isinstance(["preCommands"], list), "preCommands should be a list"
            assert isinstance(["postCommands"], list), "postCommands should be a list"


class Job:

    def __init__(self, name: str=None, **kwargs):
        self.protocol = dict() # follow the schema of https://github.com/microsoft/pai/blob/master/docs/pai-job-protocol.yaml
        if name:
            self.new(name, **kwargs)

    def new(self, name: str, **kwargs):
        self.protocol = {
            "name": name,
            "protocolVersion": 2,
            "type": "job",
            "prerequisites": [],
            "parameters": dict(),
            "secrets": dict(),
            "taskRoles": dict(),
            "deployments": [],
            "defaults": dict(),
            "extras": dict(),
        }
        self.protocol.update(kwargs)
        return self

    def load(self, fname: str=None, job_name: str=None):
        if not fname:
            fname = Job.job_cache_file(job_name)
        self.protocol = from_file(fname, default={})
        self.protocol.setdefault('protocolVersion', '1') # v1 protocol (json) has no protocolVersion
        return self

    def save(self):
        if self.name:
            to_file(self.protocol, Job.job_cache_file(self.name))
        return self

    def add_taskrole(self, name: str, t_cfg: dict):
        self.protocol["taskRoles"].setdefault(name, {}).update(t_cfg)
        return self

    def validate(self):
        assert self.protocolVersion in ["1", "2"], "unknown protocolVersion (%s)" % self.protocol["protocolVersion"]
        assert self.name is not None, "job name is null %s" % self.protocol
        if self.protocolVersion == "2":
            assert self.protocol["type"] == "job", "type must be job (%s)" % self.protocol["type"]
            for t in self.protocol["taskRoles"].values():
                TaskRole.validate(t)
            for d in self.protocol.get("deployments", []):
                Deployment.validate(d, list(self.protocol["taskRoles"].keys()))
        return self

    @property
    def protocolVersion(self):
        return str(self.protocol.get("protocolVersion", "1"))

    @property
    def name(self):
        return self.protocol.get("name" if self.protocolVersion == "2" else "jobName", None)

    @staticmethod
    def job_cache_file(job_name: str, fname: str=__protocol_filename__):
        return os.path.join(__jobs_cache__, job_name, fname)

    @staticmethod
    def get_config_file(job_name: str, v2: bool=True):
        return Job.job_cache_file(job_name, __protocol_filename__ if v2 else __config_filename__)

    def get_config(self):
        if self.protocolVersion == "2":
            for key in ["deployments", "parameters"]:
                if key in self.protocol and len(self.protocol[key]) == 0:
                    del self.protocol[key]
            for t in self.protocol["taskRoles"].values():
                if "ports" in t["resourcePerInstance"] and len(t["resourcePerInstance"]["ports"]) == 0:
                    del t["resourcePerInstance"]["ports"]
            return self.protocol
        else:
            dic = deepcopy(self.protocol)
            del dic["protocolVersion"]
            return dic

    def default_resouces(self):
        return {
            "ports": {}, "gpu": 0, "cpu": 4, "memoryMB": 8192,
        }

    # methods only for SDK-enabled jobs
    def submit(self, cluster_alias: str):
        __logger__.info("submit job %s to cluster %s", self.name, cluster_alias)
        self.validate()
        client = ClusterList().load().get_client(cluster_alias)
        # upload
        for f in self.protocol.get("extras", {}).get("__sources__", []):
            if not f:
                continue
            local_path, remote_path = f, '{}/source/{}'.format(self.protocol["secrets"]["work_directory"], f)
            client.get_storage().upload(local_path=local_path, remote_path=remote_path, overwrite=True)
        client.get_token().rest_api_submit(self.get_config())
        return client.get_job_link(self.name)

    def wait(self, cluster_alias: str, **kwargs):
        client = ClusterList().load().get_client(cluster_alias)
        return client.wait([self.name], **kwargs)

    def decorate(self, cluster_alias: str, workspace: str=None, virtual_cluster: str=None, only_it: bool=True, wdir: str="~"):
        clusters = ClusterList().load().clusters
        if only_it:
            clusters = ol.filter(clusters, 'cluster_alias', cluster_alias)["matches"]
        version = get_defaults().get("sdk-branch", __sdk_branch__)
        if virtual_cluster:
            self.protocol["defaults"]["virtualCluster"] = virtual_cluster
        self.protocol["secrets"]["clusters"] = json.dumps(clusters)
        self.protocol["secrets"]["cluster_alias"] = cluster_alias
        c_dir = '~/{}'.format(__cache__)
        c_file = '%s/%s' % (c_dir, os.path.basename(__cluster_config_file__))
        sdk_install_cmds = [
            "pip install --upgrade pip",
            "pip install -U {}".format(get_install_uri(version)),
            "mkdir %s" % c_dir,
            "echo \"write config to {}\"".format(c_file),
            "echo <% $secrets.clusters %> > {}".format(c_file),
            "opai cluster select <% $secrets.cluster_alias %>",
            "opai set logging-level=5",
        ]
        if wdir:
            sdk_install_cmds.append("cd %s" % wdir)
        if workspace:
            self.protocol["secrets"].setdefault("work_directory", '{}/jobs/{}'.format(workspace, self.name))
        for f in self.protocol["extras"].get("__sources__", []):
            assert self.protocol["secrets"].get("work_directory", None), "must specify a workspace to transfer sources"
            sdk_install_cmds.append("opai storage download <% $secrets.work_directory %>/source/{} {}".format(f, f))
        self.new_deployment("sdk_install", pre_commands=sdk_install_cmds)
        self.protocol["extras"]["submitFrom"] = "python-sdk@" + version

    def one_liner(self, commands: Union[list, str], image: str, cluster: dict, resources: dict=None, sources: list=None, submit: bool=True, enable_sdk: bool=True, **kwargs):
        self.protocol["prerequisites"].append(Job.new_unit("docker_image", "dockerimage", uri=image))
        self.add_taskrole("main", {
            "dockerImage": "docker_image",
            "resourcePerInstance": resources if resources else self.default_resouces(),
            "commands": commands if isinstance(commands, list) else [commands]
        })
        if sources:
            self.protocol["extras"].setdefault("__sources__", []).extend(sources)
        if enable_sdk:
            self.decorate(**cluster)
        if submit:
            return self.submit(cluster["cluster_alias"])
        else:
            return self.validate().get_config()

    def from_notebook(self, nb_file: str, image: str, cluster: dict, resources: dict=None, sources: list=None, submit: bool=True, interactive_mode: bool=True, token: str="abcd", **kwargs):
        if not nb_file:
            interactive_mode, nb_file = True, ""
        html_file = os.path.splitext(nb_file)[0] + ".html" if not interactive_mode else ""
        if interactive_mode:
            cmds = [
                "jupyter notebook --no-browser --ip 0.0.0.0 --port 8888 --NotebookApp.token={} --allow-root {}".format(token, nb_file),
            ]
        else:
            cmds = [
                'jupyter nbconvert --ExecutePreprocessor.timeout=-1 --to html --execute %s' % nb_file,
                'opai storage upload {} <% $secrets.work_directory %>/output/{}'.format(html_file, html_file),
            ]

        job_info = self.one_liner(
            commands = cmds,
            image=image,
            sources=[nb_file],
            resources = resources,
            cluster = cluster,
            submit = submit,
            **kwargs
        )
        if not submit:
            return job_info
        print(job_info)
        # post processing after Submitting
        client = ClusterList().load().get_client(cluster["cluster_alias"])
        print("waiting job to be started")
        if interactive_mode:
            # wait and get ip
            state = client.wait([self.name], exit_states=["SUCCEEDED", "FAILED", "RUNNING"])[0]
            assert state == "RUNNING", "why not running {}".format(state)
            while True:
                try:
                    status = client.jobs(self.name)
                    ip = status["taskRoles"]["main"]["taskStatuses"][0]["containerIp"]
                except:
                    ip = None
                    time.sleep(10)
                if ip:
                    break
            return "http://%s:8888/?token=%s" % (ip, token)
        else:
            state = client.wait([self.name])[0]
            if state != "SUCCEEDED":
                return "job failed"
            local_path, remote_path = html_file, '{}/output/{}'.format(self.protocol["secrets"]["work_directory"], html_file)
            client.get_storage().download(remote_path=remote_path, local_path=local_path)
            return html_file


    def new_deployment(self, name: str, pre_commands: list=None, post_commands: list=None, as_default: bool=True):
        deployment = {
            "name": name,
            "taskRoles": {}
        }
        for t in self.protocol["taskRoles"]:
            dic = {}
            if pre_commands:
                dic["preCommands"] = pre_commands
            if post_commands:
                dic["postCommands"] = post_commands
            deployment["taskRoles"][t] = dic
        self.protocol["deployments"].append(deployment)
        if as_default:
            self.protocol["defaults"]["deployment"] = name
        return self

    @staticmethod
    def new_unit(name: str, type: str, protocolVersion: int=2, **kwargs):
        return get_args()