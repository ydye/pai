#coding=utf-8

import os
import time
import logging
import logging.config
import argparse
import yaml
from flask import Flask, render_template, request, redirect, send_from_directory


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


@app.route("/api/v1/containers/<string:container_type>", methods=["GET"])
def get_containers(container_type):
    pass


@app.route("/api/v1/containers/<string:container_type>", methods=["POST"])
def update_containers(container_type):
    pass




def main():
    parser = setup_parser()
    args = parser.parse_args()
    setup_logging()
    app.logger.info("test")
    app.run(host="0.0.0.0", port=args.port, debug=args.debug)


if __name__ == "__main__":
    main()

