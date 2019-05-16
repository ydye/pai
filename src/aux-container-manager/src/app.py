#coding=utf-8

import os
import time
import logging
import logging.config
import argparse
import yaml
from flask import Flask, jsonify

from containers import DockerOp


app = Flask(__name__)


def setup_logging(default_path='config/logging.yaml', default_level=logging.INFO, env_key='LOG_CFG'):
    path = default_path
    value = os.getenv(env_key, None)
    if value:
        path = value
    if os.path.exists(path):
        with open(path, 'rt') as f:
            config = yaml.load(f.read())
        logging.config.dictConfig(config)
    else:
        logging.basicConfig(level=default_level)


def setup_parser():
    parser = argparse.ArgumentParser()

    parser.add_argument("-p", "--port", dest="port", default=5000, help="Listen port, default is 5000")
    parser.add_argument("--debug", dest="debug", required=False, action="store_true", default=False,
                        help="Open debug mode")
    return parser


@app.route("/api/v1/containers/<string:container_type>/gpu", methods=["GET"])
def get_containers_gpus(container_type):
    response_dict = {
        "status": "failure",
        "data": []
    }
    docker_client = DockerOp()
    if container_type == "all":
        containers = docker_client.get_all_containers()
    elif container_type == "guaranteed":
        containers = docker_client.get_guarantee__containers()
    elif container_type == "opportunistic":
        containers = docker_client.get_opportunistic_containers()
    else:
        app.logger.warning("Unknown container type: {}".format(container_type))
        return jsonify(response_dict)

    used_gpus = set()
    for container in containers:
        used_gpus |= container.gpu

    used_gpu_list = [int(gpu) for gpu in used_gpus]
    used_gpu_list.sort()
    response_dict["status"] = "success"
    response_dict["data"] = used_gpu_list
    return jsonify(response_dict)



@app.route("/api/v1/containers/<string:container_type>/kill", methods=["POST"])
def kill_containers(container_type):
    response_dict = {
        "status": "failure",
        "data": ""
    }
    docker_client = DockerOp()
    if container_type == "all":
        containers = docker_client.get_all_containers()
    elif container_type == "guaranteed":
        containers = docker_client.get_guarantee_containers()
    elif container_type == "opportunistic":
        containers = docker_client.get_opportunistic_containers()
    else:
        app.logger.warning("Unknown container type: {}".format(container_type))
        return jsonify(response_dict)

    for container in containers:
        container.stop()

    response_dict["status"] = "success"
    response_dict["data"] = ""
    return jsonify(response_dict)


def main():
    parser = setup_parser()
    args = parser.parse_args()
    setup_logging()
    app.run(host="0.0.0.0", port=args.port, debug=args.debug)


if __name__ == "__main__":
    main()

