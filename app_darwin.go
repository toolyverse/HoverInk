//go:build darwin

package main

import (
	"context"
	"time"
	"unsafe"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

/*
#cgo CFLAGS: -x objective-c
#cgo LDFLAGS: -framework Cocoa -framework CoreGraphics

#import <Cocoa/Cocoa.h>
#import <CoreGraphics/CoreGraphics.h>

void makeWindowTransparent(void* win) {
    dispatch_async(dispatch_get_main_queue(), ^{
        NSWindow* w = (__bridge NSWindow*)win;
        if (w == nil) return;

        // 1. Clear NSWindow background
        [w setBackgroundColor:[NSColor clearColor]];
        [w setOpaque:NO];

        // 2. If Wails added an NSVisualEffectView (from WindowIsTranslucent),
        //    remove it — it causes the dark blur overlay.
        NSView* contentView = [w contentView];
        for (NSView* subview in [contentView subviews]) {
            if ([subview isKindOfClass:[NSVisualEffectView class]]) {
                [subview removeFromSuperview];
            }
        }

        // 3. Make the content view and its layer fully transparent
        [contentView setWantsLayer:YES];
        [contentView layer].backgroundColor = CGColorGetConstantColor(kCGColorClear);
        [contentView layer].opaque = NO;
    });
}

void* findWindowByTitle(const char* title) {
    NSString* nsTitle = [NSString stringWithUTF8String:title];
    for (NSWindow* w in [NSApp windows]) {
        if ([[w title] isEqualToString:nsTitle]) {
            return (__bridge_retained void*)w;
        }
    }
    return NULL;
}

void setClickThrough(void* win, int enable) {
    dispatch_async(dispatch_get_main_queue(), ^{
        NSWindow* w = (__bridge NSWindow*)win;
        if (w == nil) return;
        [w setIgnoresMouseEvents:(enable ? YES : NO)];
    });
}

int isEscPressed() {
    return CGEventSourceKeyState(kCGEventSourceStateHIDSystemState, 53) ? 1 : 0;
}
*/
import "C"

type App struct {
	ctx          context.Context
	win          unsafe.Pointer
	clickThrough bool
}

func NewApp() *App {
	return &App{}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	go a.initWindow()
	go a.listenGlobalHotkeys()
}

func (a *App) initWindow() {
	for i := 0; i < 50; i++ {
		time.Sleep(100 * time.Millisecond)
		if a.getWindow() != nil {
			C.makeWindowTransparent(a.win)
			return
		}
	}
}

func (a *App) getWindow() unsafe.Pointer {
	if a.win != nil {
		return a.win
	}
	title := C.CString("HoverInk")
	defer C.free(unsafe.Pointer(title))
	ptr := C.findWindowByTitle(title)
	if ptr != nil {
		a.win = ptr
	}
	return a.win
}

func (a *App) toggleClickThrough() {
	win := a.getWindow()
	if win == nil {
		return
	}
	a.clickThrough = !a.clickThrough
	if a.clickThrough {
		C.setClickThrough(win, 1)
	} else {
		C.setClickThrough(win, 0)
	}
	runtime.EventsEmit(a.ctx, "modeChanged", a.clickThrough)
}

func (a *App) listenGlobalHotkeys() {
	time.Sleep(2 * time.Second)
	wasPressed := false
	for {
		pressed := C.isEscPressed() != 0
		if pressed && !wasPressed {
			a.toggleClickThrough()
		}
		wasPressed = pressed
		time.Sleep(16 * time.Millisecond)
	}
}
