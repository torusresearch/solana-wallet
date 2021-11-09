import { EventEmitter } from "events";

import { FEATURES_DEFAULT_POPUP_WINDOW } from "@/utils/enums";

// TODO : remaining to handle the case if window is already opened like in Torus Wallet, using Streams

export class PopupHandler extends EventEmitter {
  window: any = undefined;
  windowTimer: any = undefined;
  iClosedWindow = false;
  constructor(private url: string | URL, private preopenInstanceId: any, private target: string = "_blank") {
    super();
    const localUrl = url instanceof URL ? url : new URL(url);
    this.url = localUrl.href;
    this._setupTimer();
  }

  _setupTimer() {
    this.windowTimer = setInterval(() => {
      if (this.window && this.window.closed) {
        clearInterval(this.windowTimer);
        if (!this.iClosedWindow) {
          this.emit("close");
        }
        this.iClosedWindow = false;
        this.window = undefined;
      }
      if (this.window === undefined) clearInterval(this.windowTimer);
    }, 500);
  }

  open() {
    // if window is already open
    if (!this.preopenInstanceId) {
      this.window = window.open(this.url, this.target, FEATURES_DEFAULT_POPUP_WINDOW);
      return Promise.resolve();
    }

    return this.window.open(this.url);
  }

  close() {
    this.iClosedWindow = true;
    if (this.window) this.window.close();
  }
}
