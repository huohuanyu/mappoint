# mappoint
利用百度API实现地图标点并测距的需求，同时还用到了关键词搜索定位、多标点加载、判断标点位置（逆地址解析）等小功能。

###项目文件介绍：
+ js
	- index.js 主要逻辑实现js文件
	- Baidu_DistanceTool_1.2.js 百度测距api，根据自身项目需求，有做一些修改
+ images
	- marker_blue.png #正在标点的标点颜色
	- marker_red.png #已入库的标点颜色
- index.html 入口文件
- savePoint.php 标点完成后，提交到后端的程序处理文件