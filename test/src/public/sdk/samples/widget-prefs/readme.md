Widget Prefs
================

Description
---------------------
Sample user prefs widget.

Purpose
---------------------
Show how to use different user prefs in widgets

Behavior
---------------------
Changes when prefs are supplied to widget by adding `&up_%USER_PREF_NAME%=%USER_PREF_VALUE%` to widgets render URL

Usage
---------------------
1.  Provide widget URL as argument to widget rendering system in browser
2.  Check widgets render URL
3.  Provide user prefs to widgets render URL e.g. :  
`%widget-render-url%&up_hello_pref=123&up_enum_pref=gray&up_boolean_pref=true`  
4. Widgets contents should accept prefs and change

Path to widget
---------------------
`src/main/webapp/widget-prefs.xml`

Troubleshooting
---------------------
1. Check widget rendering system availability and IsAlives (if applicable) 
2. Check widget widget URL direct access in browser - raw XML should be displayed
3. Check browser developer tools console for errors/warnings
4. Check up_ prefix to prefs in url