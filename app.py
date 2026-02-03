import flask
from user import user_bp
from Scanner import Scanner_bp

app = flask.Flask(__name__)

@app.route("/")
def home():
    return "Api Køre"


app.register_blueprint(user_bp, url_prefix="/api/v1/user")
app.register_blueprint(Scanner_bp, url_prefix="/api/v1/Scanner")

if __name__ == "__main__":
    app.run(debug=True)