#NoEnv           ; Recommended for performance and compatibility with future AutoHotkey releases.
#MaxHotkeysPerInterval 1000
SendMode Input   ; Recommended for new scripts due to its superior speed and reliability.

#IfWinActive ahk_class Chrome_WidgetWin_1
F6::^+8          ;toggle tokyo listings extension
!8::Send ^w      ;close tab
!9::             ;save listing
    Send ^s
    WinWait Save As
    Send {enter}
    WinWaitActive Confirm Save As,, 1
    if !ErrorLevel
    {
        Send {enter}
        loop 4 
        { 
            Send `t 
        }
        Send {enter}
    }
    sleep, 100
    Send ^+9    ;Pass url to Tokyo Listings
return

#IfWinActive ahk_class MozillaWindowClass
!8::Send ^w      ;close tab
!9::             ;save listing
    Send ^s
    WinWait Save As
    Send {enter}
    WinWaitActive Confirm Save As,, 1
    if !ErrorLevel
    {
        Send {enter}
        loop 4 
        { 
            Send `t 
        }
        Send {enter}
    }
return