import docker
import logging
import re
import os
import time

logger = logging.getLogger(__name__)


class PaiContainer(object):
    name_pattern = re.compile(r"([^-]+)-([A-Za-z0-9\-._]+)-(container(?:_\w+)?_(\d+_\d+)_\d+_\d+)")
    err_file_path = "/userlogs/{yarn_application}/{yarn_container}/oppor.pai.error"

    def __init__(self, container):
        self.container = container
        self.name = container.name

        self.username, self.jobname, self.yarn_container = "", "", ""
        self.yarn_application = ""
        match = re.match(self.name_pattern, container.name)
        if match:
            self.username, self.jobname, self.yarn_container, application_id = match.groups()
            self.yarn_application = "application_" + application_id

        self.full_err_file = self.err_file_path.format(yarn_application=self.yarn_application,
                                                       yarn_container=self.yarn_container)

        self.priority = "guaranteed"
        if container.labels.get("priority") == "opportunistic":
            self.priority = "opportunistic"

        self.gpu = set()
        if "GPU_ID" in container.labels:
            self.gpu = set(container.labels["GPU_ID"].split(","))

    def is_job_container(self):
        return self.username != "" and self.jobname != "" and self.yarn_container != ""

    def stop(self, kill_reason="Container killed to reclaim resource"):
        if os.path.exists(self.full_err_file) or os.path.exists(self.full_err_file+".tmp"):
            return
        timestamp = int(time.time())
        with open(self.full_err_file+".tmp", "w") as f:
            f.writelines([
                "{0} ERROR ACTION \"KILL\"\n".format(timestamp),
                "{0} ERROR REASON \"{1}\"\n".format(timestamp, kill_reason),
                "{0} ERROR SOLUTION \"{1}\"\n".format(timestamp, "")
            ])
        os.rename(self.full_err_file+".tmp", self.full_err_file)


class DockerOp(object):
    def __init__(self):
        self.client = docker.DockerClient(base_url='unix://var/run/docker.sock', version='auto', timeout=10)

    def _list(self):
        container_list = []
        try:
            container_list = self.client.containers.list()
        except Exception as e:
            logging.warning(e, exc_info=True)

        wrapper = [PaiContainer(container) for container in container_list]
        return wrapper

    def get_guarantee_containers(self):
        containers = [container for container in self._list()
                      if container.is_job_container() and container.priority == "guaranteed"]
        return containers

    def get_opportunistic_containers(self):
        containers = [container for container in self._list()
                      if container.is_job_container() and container.priority == "opportunistic"]
        return containers

    def get_all_containers(self):
        containers = [container for container in self._list()
                      if container.is_job_container()]
        return containers

def test():
    docker_client = DockerOp()
    print(docker_client.get_guarantee_containers())


if __name__ == "__main__":
    test()
