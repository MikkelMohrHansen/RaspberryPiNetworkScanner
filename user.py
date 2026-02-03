import flask

user_bp = flask.Blueprint("user", __name__)

@user_bp.route("/login", methods=["POST"])
def login():
    data = flask.request.get_json(silent=True) or {}
    username = data.get("username")
    password = data.get("password")


