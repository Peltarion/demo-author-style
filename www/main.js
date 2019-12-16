window.peltarionApp = {
    isInit: false,
    main: null
};

((app) => {
    class API {
        constructor(endpoint) {
            this._endpoint = endpoint;
        }

        classifyText(text) {
            return fetch(`${this._endpoint}/api/classify`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ "text": text})
            }).then(response => response.json());
        }
        getAuthorMetadata(author) {
            const params = new URLSearchParams({ "author": author });
            return fetch(`${this._endpoint}/api/metadata?${params.toString()}`)
              .then(response => response.json())
              .then(json => {
                  if (json.source === "wikipedia") {
                      json.title = json.title.replace(/\s-\sWikipedia$/, "");
                  }
                  return json;
              });
        }
    }
    const ErrorTypes = Object.freeze({
        "Validation": "validation",
        "Service": "service"
    });
    class View {
        constructor(elementId) {
            this._element = document.getElementById(elementId);
        }
        get element() {
            return this._element;
        }
        get disabled() {
            return this.hasAttribute("disabled");
        }
        set disabled(value) {
            if (value) {
                this.setAttribute("disabled", "disabled");
            } else {
                this.removeAttribute("disabled");
            }
        }
        get hidden() {
            return this.hasAttribute("data-hidden");
        }
        set hidden(value) {
            if (value) {
                this.setAttribute("data-hidden", "true");
            } else {
                this.removeAttribute("data-hidden");
            }
        }
        get state() {
            return this.getAttribute("data-state");
        }
        set state(value) {
            this.setAttribute("data-state", value);
        }
        setAttribute(attr, value) {
            this.element.setAttribute(attr, value);
        }
        getAttribute(attr) {
            return this.element.getAttribute(attr);
        }
        hasAttribute(attr) {
            return this.element.hasAttribute(attr);
        }
        removeAttribute(attr) {
            this.element.removeAttribute(attr);
        }
    }

    class MainView extends View {
        constructor() {
            super("main-view");
        }
        setViewState(state) {
            this.state = state;
        }
    }

    class ResultView extends View {
        constructor() {
            super("result-view");
            this._restartButton = new View("restart-button");
            this._imageView = new View("result-image");
            this._textView = new View("result-text");
            this._authorTextView = new View("result-author");
            this._attributionLink = new View("attribution-link");
            this._extensions = []; // Not used in tutorial. Used in served version to manage share links
        }

        get extensions() {
            return this._extensions;
        }

        set onRestart(handler) {
            this._restartButton.element.onclick = handler;
        }
        get onRestart() {
            return this._restartButton.element.onclick;
        }

        setViewState(metadata, text) {
            this._textView.element.innerHTML = text ? "" : text;
            this._imageView.hidden = true;
            if (metadata) {
                if (metadata.image) {
                    this._imageView.hidden = false;
                    this._imageView.setAttribute("src", metadata.image);
                }
                this.state = metadata.title;
                this._authorTextView.element.innerHTML = metadata.title;
                this._attributionLink.setAttribute("href", metadata.url);
                this._extensions.forEach(e => { e.setViewState([metadata, text]); });
            }
        }
    }

    const InputViewStates = Object.freeze({
        "Loading": "loading",
        "ServiceError": "service-error",
        "ValidationError": "validation-error",
        "Idle": "idle"
    });

    class InputView extends View {
        constructor() {
            super("input-view");
            this._input = new View("text");
            this._form = new View("text-form");
            this._button = new View("submit");
        }
        set onSubmit(handler) {
            this._form.element.onsubmit = handler;
        }
        get onSubmit() {
            return this._form.element.onsubmit;
        }
        setViewState(inputState) {
            switch (inputState) {
                case InputViewStates.Loading:
                    this._button.disabled = true;
                    break;
                case InputViewStates.ServiceError:
                case InputViewStates.ValidationError:
                case InputViewStates.Idle:
                    this._button.disabled = false;
                    break;
            }
            this.state = inputState;
        }
        validateInputText() {
            const text = this.getInputText();
            return text.split(" ").length > 8;
        }
        getInputText() {
            return this._input.element.value;
        }
        clearInputText() {
            this._input.element.value = "";
        }
    }

    const MainViewStates = Object.freeze({
        "Result": "result",
        "Input": "input"
    });

    class App {
        constructor(api) {
            this._api = api;
            this._resultView = new ResultView();
            this._inputView = new InputView();
            this._mainView = new MainView();
            this._inputView.onSubmit = this.onSubmitText.bind(this);
            this._resultView.onRestart = this.onClickRestart.bind(this);
            this._isLoading = false;
        }
        navigateTo(route, params) {
            window.history.pushState(params ? params : {}, "", route);
            this.navigatedTo(route);
        }

        navigatedTo(route) {
            const components = route.split("/");
            switch (components[1]) {
                case MainViewStates.Result:
                    this._api.getAuthorMetadata(decodeURIComponent(components[2]))
                      .then((metadata) => {
                          this._isLoading = false;
                          this._inputView.setViewState(InputViewStates.Idle);
                          return { metadata: metadata, text: text };
                      })
                      .then(resultData => this.showResult(resultData))
                      .catch(err => {
                          this.showError(ErrorTypes.Service, err);
                      } );
                    break;
                case MainViewStates.Input:
                default:
                    this.doRestart();
                    break;
            }
        }
        onSubmitText() {
            if (!this._isLoading) {
                if (this._inputView.validateInputText()) {
                    this.doSubmitText(this._inputView.getInputText());
                } else {
                    this.showError(ErrorTypes.Validation);
                }
            }
            return false;
        }
        onClickRestart() {
            this.navigateTo("/");
            return false;
        }
        // handlers
        doSubmitText(text) {
            this._isLoading = true;
            this._resultView.setViewState();
            this._inputView.setViewState(InputViewStates.Loading);
            return this._api.classifyText(text)
              .then(result => {
                  const authorMap = result.author;
                  const author = Object.keys(authorMap).reduce((p, c) => authorMap[c] > authorMap[p] ? c : p).toLowerCase();
                  this.navigateTo("/result/" + encodeURIComponent(author));
              })
              .catch(err => {
                  this._isLoading = false;
                  this.showError(ErrorTypes.Service, err);
              } );
        }
        doRestart() {
            this._inputView.setViewState(InputViewStates.Idle);
            this._inputView.clearInputText();
            this.showInput();
        }
        // states
        showResult(resultData) {
            this._mainView.setViewState(MainViewStates.Result);
            this._resultView.setViewState(resultData.metadata, resultData.text);
            this._inputView.hidden = true;
            this._resultView.hidden = false;
        }
        showInput() {
            this._resultView.hidden = true;
            this._inputView.hidden = false;
            this._mainView.setViewState(MainViewStates.Input);
        }
        showError(errorType, msg) {
            switch (errorType) {
                case ErrorTypes.Validation:
                    this._inputView.setViewState(InputViewStates.ValidationError);
                    break;
                case ErrorTypes.Service:
                    this._inputView.setViewState(InputViewStates.ServiceError);
                    break;
            }
        }
    }
    const u = new URL(window.location.href);
    app.main = new App(new API(u.protocol + "//" + u.hostname + (u.port ? ":" + u.port : "")));
    app.isInit = true;
    app.main.navigatedTo(u.pathname);
})(window.peltarionApp);