package main

import (
	"context"
	"syscall"
	"time"
	"unsafe"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

var (
	user32                = syscall.NewLazyDLL("user32.dll")
	procFindWindowW       = user32.NewProc("FindWindowW")
	procSetWindowLongPtrW = user32.NewProc("SetWindowLongPtrW")
	procGetWindowLongPtrW = user32.NewProc("GetWindowLongPtrW")
	procGetAsyncKeyState  = user32.NewProc("GetAsyncKeyState")
)

const (
	GWL_EXSTYLE       = ^uintptr(19) // -20 as uintptr (two's complement)
	WS_EX_TRANSPARENT = uintptr(0x00000020)
	WS_EX_LAYERED     = uintptr(0x00080000)
	VK_ESCAPE         = uintptr(0x1B)
)

type App struct {
	ctx          context.Context
	hwnd         uintptr
	clickThrough bool
}

func NewApp() *App {
	return &App{}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	go a.listenGlobalHotkeys()
}

func (a *App) getWindowHandle() uintptr {
	if a.hwnd != 0 {
		return a.hwnd
	}

	titlePtr, err := syscall.UTF16PtrFromString("HoverInk")
	if err != nil {
		return 0
	}

	ret, _, _ := procFindWindowW.Call(
		0,
		uintptr(unsafe.Pointer(titlePtr)),
	)
	a.hwnd = ret
	return a.hwnd
}

func (a *App) toggleClickThrough() {
	hwnd := a.getWindowHandle()
	if hwnd == 0 {
		return
	}

	style, _, _ := procGetWindowLongPtrW.Call(hwnd, GWL_EXSTYLE)

	a.clickThrough = !a.clickThrough

	if a.clickThrough {
		style |= WS_EX_LAYERED | WS_EX_TRANSPARENT
	} else {
		style &^= WS_EX_TRANSPARENT
		style |= WS_EX_LAYERED
	}

	procSetWindowLongPtrW.Call(hwnd, GWL_EXSTYLE, style)

	runtime.EventsEmit(a.ctx, "modeChanged", a.clickThrough)
}

func (a *App) listenGlobalHotkeys() {
	for {
		ret, _, _ := procGetAsyncKeyState.Call(VK_ESCAPE)
		if ret&0x8000 != 0 {
			a.toggleClickThrough()
			time.Sleep(300 * time.Millisecond)
		}
		time.Sleep(10 * time.Millisecond)
	}
}
