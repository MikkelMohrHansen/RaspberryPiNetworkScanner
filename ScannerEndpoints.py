import flask

from Database import DB_Data
from Database.DB_Data import *



Scanner_bp = flask.Blueprint("Scannerdb", __name__)

@Scanner_bp.route("/getApproved",methods=['GET'])
def getApproved():
    data = DB_Data.getApproved()
    return flask.jsonify(data), 200

@Scanner_bp.route("/getUnapproved", methods=['GET'])
def getUnapproved():
    data = DB_Data.getUnapproved()
    return flask.jsonify(data), 200

@Scanner_bp.route("/addApproved", methods=['POST'])
def addApproved():
    data = flask.request.json
    ip_address = data.get("ip_address")
    mac_address = data.get("mac_address")
    description = data.get("description")

    result = DB_Data.add_approved(ip_address, mac_address, description)
    return flask.jsonify(result), 200

@Scanner_bp.route("/updateApproved", methods=['PUT'])
def updateApproved():
    data = flask.request.json
    ip_address = data.get("ip_address")
    mac_address = data.get("mac_address")
    description = data.get("description")

    result = DB_Data.update_approved(mac_address, ip_address, description)
    return flask.jsonify(result), 200

@Scanner_bp.route("/updateUnApproved", methods=['PUT'])
def updateUnApproved():
    data = flask.request.json
    ip_address = data.get("ip_address")
    mac_address = data.get("mac_address")
    

    result = DB_Data.update_unapproved(mac_address, ip_address)
    return flask.jsonify(result), 200

@Scanner_bp.route("/removeApproved", methods=['DELETE'])
def removeApproved():
    data = flask.request.json
    mac_address = data.get("mac_address")

    result = DB_Data.remove_approved(mac_address)
    return flask.jsonify(result), 200

@Scanner_bp.route("/addUnapproved", methods=['POST'])
def addUnapproved():
    data = flask.request.json
    ip_address = data.get("ip_address")
    mac_address = data.get("mac_address")

    result = DB_Data.add_unapproved(ip_address, mac_address)
    return flask.jsonify(result), 200
