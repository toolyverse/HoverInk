//go:build linux

package main

import (
	"context"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type App struct {
	ctx          context.Context
	clickThrough bool
}

func NewApp() *App {
	return &App{}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	go a.listenGlobalHotkeys()
}

func (a *App) toggleClickThrough() {
	a.clickThrough = !a.clickThrough
	runtime.EventsEmit(a.ctx, "modeChanged", a.clickThrough)
	// TODO: Linux click-through via X11/Wayland (e.g. _NET_WM_STATE_BELOW + XShapeSelectInput)
}

func (a *App) listenGlobalHotkeys() {
	// TODO: Linux global hotkey (e.g. via XGrabKey or evdev)
	// For now just a no-op loop so the binary compiles
	for {
		time.Sleep(1 * time.Second)
	}
}
