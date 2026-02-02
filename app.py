import flask as flask

app = flask.Flask(__name__)

@app.route('/')
def home():
    return "Welcome to the Raspberry Pi Network Scanner!"

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)