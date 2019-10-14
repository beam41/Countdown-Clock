import React from "react";
import io from "socket.io-client";
import "./App.css";

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      response: null,
      valuemilli: 0,
      valuemin: 0,
      valuesec: 0,
      width: window.innerWidth
    };

    this.socket = io("http://localhost:4000/");

    this.handleChangeMin = this.handleChangeMin.bind(this);
    this.handleChangeSec = this.handleChangeSec.bind(this);
    this.sentStartData = this.sentStartData.bind(this);
    this.sentResumeData = this.sentResumeData.bind(this);
    this.sentStopData = this.sentStopData.bind(this);
    this.sentResetData = this.sentResetData.bind(this);
    this.updateWindowDimensions = this.updateWindowDimensions.bind(this);
  }

  componentDidMount() {
    this.socket.on("res", data => {
      if (data !== null) {
        if (data.hasOwnProperty("reset")) {
          if (data.reset) {
            this.setState({ response: null, valuemilli: 0 });
            this.setMinSec();
          }
        } else {
          this.setState({ response: data });
          this.dataManip();
        }
      }
    });
    this.socket.emit("new");

    this.interval = setInterval(() => this.dataManip(), 10);
    window.addEventListener("resize", this.updateWindowDimensions);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
    window.removeEventListener("resize", this.updateWindowDimensions);
  }

  updateWindowDimensions() {
    this.setState({ width: window.innerWidth });
  }

  dataManip() {
    const { response } = this.state;
    if (response !== null) {
      if (response.stopped)
        this.setState(
          {
            valuemilli: this.calcTimeLeft(
              response.startAt,
              response.cdLength,
              response.stopAt
            )
          },
          this.setMinSec()
        );
      else
        this.setState(
          {
            valuemilli: this.calcTimeLeft(response.startAt, response.cdLength)
          },
          this.setMinSec()
        );
    }
  }

  setMinSec() {
    const { valuemilli } = this.state;
    const min = Math.floor(valuemilli / 60000);
    const sec = Math.ceil(valuemilli / 1000) % 60;
    this.setState({
      valuemin: sec < 1 && valuemilli > 1 ? min + 1 : min,
      valuesec: sec
    });
  }

  handleChangeMin(event) {
    if (!isNaN(event.target.value))
      this.setState({
        valuemin: Math.max(0, Math.min(+event.target.value, 99))
      });
  }

  handleChangeSec(event) {
    if (!isNaN(event.target.value))
      this.setState({
        valuesec: Math.max(0, Math.min(+event.target.value, 59))
      });
  }

  sentStartData(event) {
    this.setState(
      {
        valuemilli: (this.state.valuemin * 60 + this.state.valuesec) * 1000
      },
      () => {
        const { valuemilli } = this.state;
        if (valuemilli > 0)
          this.socket.emit("start", {
            startAt: Date.now(),
            cdLength: valuemilli
          });
      }
    );
    event.preventDefault();
  }

  sentResumeData(event) {
    const { valuemilli } = this.state;
    this.socket.emit("start", {
      startAt: Date.now(),
      cdLength: valuemilli
    });
    event.preventDefault();
  }

  sentStopData(event) {
    this.socket.emit("stop", {
      stopAt: Date.now()
    });
    event.preventDefault();
  }

  sentResetData(event) {
    this.socket.emit("reset");
    event.preventDefault();
  }

  calcTimeLeft(start, length, now = Date.now()) {
    const end = start + length;
    return end - now;
  }

  render() {
    const { response } = this.state;

    const resumeButton = () => {
      if (this.state.valuemilli > 0)
        return (
          <button
            type="button"
            onClick={this.sentResumeData}
            className="green whiter"
          >
            resume
          </button>
        );
    };

    const size = () => {
      if (this.state.width > 878) return { fontSize: "20rem" };
      else if (this.state.width < 460) return { fontSize: "5rem" };
      else return { fontSize: "10rem" };
    };

    const clock = () => {
      if (response === null) {
        return (
          <>
            <div className="box start" style={size()}>
              <input
                type="text"
                value={this.state.valuemin.toString().padStart(2, "0")}
                onChange={this.handleChangeMin}
                style={size()}
              />
              :
              <input
                type="text"
                value={this.state.valuesec.toString().padStart(2, "0")}
                onChange={this.handleChangeSec}
                style={size()}
              />
            </div>
            <div className="box">
              <button
                type="button"
                onClick={this.sentStartData}
                className="green whiter"
              >
                start
              </button>
            </div>
          </>
        );
      } else if (!response.stopped) {
        return (
          <>
            <div className="box readonly" style={size()}>
              <input
                type="text"
                value={this.state.valuemin.toString().padStart(2, "0")}
                readOnly
                style={size()}
              />
              :
              <input
                type="text"
                value={this.state.valuesec.toString().padStart(2, "0")}
                readOnly
                style={size()}
              />
            </div>
            <div className="box">
              <button
                type="button"
                onClick={this.sentStopData}
                className="red whiter"
              >
                stop
              </button>
            </div>
          </>
        );
      } else if (response.stopped) {
        return (
          <>
            <div className="box readonly" style={size()}>
              <input
                type="text"
                value={this.state.valuemin.toString().padStart(2, "0")}
                readOnly
                style={size()}
              />
              :
              <input
                type="text"
                value={this.state.valuesec.toString().padStart(2, "0")}
                readOnly
                style={size()}
              />
            </div>
            <div className="box">
              {resumeButton()}
              <button
                type="button"
                onClick={this.sentResetData}
                className="red"
              >
                reset
              </button>
            </div>
          </>
        );
      }
    };

    return <div className="container">{clock()}</div>;
  }
}

export default App;
