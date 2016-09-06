Widget render types
================

Description
---------------------
Widget with different render type content.

Purpose
---------------------
Show different render types for widget contents

Behavior
---------------------
Shows different content according to supplied render type

Usage
---------------------
1.  Provide widget URL as argument to widget rendering system in browser
2.  Provide render type as a parameter to vidget render URL e.g.  
`%widget-render-url%&renderType=iframe`      
`%widget-render-url%&renderType=inline`    
3. Different content should be displayed

Path to widget
---------------------
`src/main/webapp/widget-render-types.xml`

Troubleshooting
---------------------
1. Check widget rendering system availability and IsAlives (if applicable) 
2. Check widget widget URL direct access in browser - raw XML should be displayed
3. Check browser developer tools console for errors/warnings