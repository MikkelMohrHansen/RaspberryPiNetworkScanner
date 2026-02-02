import flask

from Database import DB_Data
from Database.DB_Data import *



Scanner_bp = flask.Blueprint("Scanner", __name__)

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
    return "!"
@Scanner_bp.route("/updateApproved", methods=['PUT'])
def updateApproved():
    return "!#¤¤"
@Scanner_bp.route("/updateUnApproved", methods=['PUT'])
def updateUnApproved():
    return "!782346"
@Scanner_bp.route("/removeApproved", methods=['DELETE'])
def removeApproved():
    return "removed"
