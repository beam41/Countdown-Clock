import React from "react";
import io from "socket.io-client";
import "./App.css";

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      response: null,
      value: 10000,
      socket: io("http://localhost:4000/")
    };

    this.handleChange = this.handleChange.bind(this);
    this.sentStartData = this.sentStartData.bind(this);
    this.sentStopData = this.sentStopData.bind(this);
    this.sentResetData = this.sentResetData.bind(this);
  }

  componentDidMount() {
    this.state.socket.on("res", data => {
      if (data.hasOwnProperty("reset")) {
        if (data.reset) {
          this.setState({ response: null, value: 10000 });
        }
      } else {
        this.setState({ response: data });
        this.dataManip();
      }
    });

    this.interval = setInterval(() => this.dataManip(), 10);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  dataManip() {
    const { response } = this.state;
    if (response !== null) {
      if (response.stopped)
        this.setState({
          value: this.calcTimeLeft(
            response.startAt,
            response.cdLength,
            response.stopAt
          )
        });
      else
        this.setState({
          value: this.calcTimeLeft(response.startAt, response.cdLength)
        });
    }
  }

  handleChange(event) {
    this.setState({ value: event.target.value });
  }

  sentStartData(event) {
    const { value } = this.state;
    this.state.socket.emit("start", {
      startAt: Date.now(),
      cdLength: value
    });
    event.preventDefault();
  }

  sentStopData(event) {
    this.state.socket.emit("stop", {
      stopAt: Date.now()
    });
    event.preventDefault();
  }

  sentResetData(event) {
    this.state.socket.emit("reset");
    event.preventDefault();
  }

  calcTimeLeft(start, length, now = Date.now()) {
    const end = start + length;
    return end - now;
  }

  render() {
    const { response } = this.state;

    const clock = () => {
      if (response === null) {
        return (
          <>
            <input
              type="text"
              value={this.state.value}
              onChange={this.handleChange}
            />
            <button type="button" onClick={this.sentStartData}>
              start
            </button>
          </>
        );
      } else if (!response.stopped) {
        return (
          <>
            <input type="text" value={this.state.value} readOnly />
            <button type="button" onClick={this.sentStopData}>
              stop
            </button>
          </>
        );
      } else if (response.stopped) {
        return (
          <>
            <input type="text" value={this.state.value} readOnly />
            <button type="button" onClick={this.sentResetData}>
              reset
            </button>
          </>
        );
      }
    };

    return <div className="box">{clock()}</div>;
  }
}

export default App;
