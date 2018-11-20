## WebRTC desktop capture
一个WebRTC桌面投射扩展和一个用于展示的网页，使用了chrome.desktopCapture, RTCPeerCOnnection和getUserMedia接口，并没有真正的连接到ICE服务器。

## 使用说明：
1. 修改manifest的content_scripts字段中的match，使得index.html有权限访问该extension
2. 使用浏览器加载extension文件夹
3. 使用浏览器打开index.html，然后点击Share Screen

## 注意：
本例是在[google](https://github.com/webrtc/samples/tree/gh-pages/src/content/extensions/desktopcapture)的例子上，使用RTCPeerConnection修改得到。