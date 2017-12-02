var pointList = []; //保存标点的数组
var addOverlayList = []; //保存添加过的覆盖物，在清除覆盖物时使用
var isPointOver = true; //判断此次标点是否结束,当提交保存成功后本次才算结束，确认提交取消按钮时还可继续标点
var addOverlayPoints = []; //保存显示的标点
//保存比例尺及其对应的米数
var zoomList = [];
zoomList[19] = 20;
zoomList[18] = 50;
zoomList[17] = 100;
zoomList[16] = 200;
zoomList[15] = 500;
zoomList[14] = 1000;
zoomList[13] = 2000;
zoomList[12] = 5000;
zoomList[11] = 10000;
zoomList[10] = 20000;
zoomList[9] = 25000;
zoomList[8] = 50000;
zoomList[7] = 100000;
zoomList[6] = 200000;
zoomList[5] = 500000;
zoomList[4] = 1000000;
zoomList[3] = 2000000;

//自定义样式
var customStyle = {
    "borderColor":"#20A0E4", //标点之间连线颜色
    "redMarkerSrc":"./images/marker_red.png", //已提交的标点样式
    "blueMarkerSrc":"./images/marker_blue.png" //本次待提交的标点样式
};

//初始化百度地图信息
//enableMapClick:false 设置景点不可点，默认为true，点击景点时，弹出景点详情
var map = new BMap.Map('map_canvas',{enableMapClick:false});
map.centerAndZoom(city, 16);
map.addControl(new BMap.NavigationControl());        // 添加平移缩放控件
map.addControl(new BMap.ScaleControl());             // 添加比例尺控件
map.addControl(new BMap.OverviewMapControl());       //添加缩略地图控件
map.enableScrollWheelZoom();                         //启用滚轮放大缩小
//map.disable3DBuilding();

//设置绘制铁路线样式
var styleJson = [{
    "featureType": "railway",
    "elementType": "all",
    "stylers": {
        "color": "#000000",
    }
}]
map.setMapStyle({styleJson:styleJson});

//地图测距功能初始化
var opts = {
    "followText":"单击确定标点，双击结束标点",
    "lineColor":"#20A0E4",
    "secIcon":new BMap.Icon(customStyle.blueMarkerSrc, new BMap.Size(21, 35)),
};
var myDis = new BMapLib.DistanceTool(map,opts);

//添加地图是否加载完毕的事件
var bs,bssw,bsne;
map.addEventListener("tilesloaded",function(){//地图加载完毕
    bs = map.getBounds();   //获取可视区域
    bssw = bs.getSouthWest();   //可视区域左下角
    bsne = bs.getNorthEast();   //可视区域右上角
    //console.log("当前地图可视范围是：" + bssw.lng + "," + bssw.lat + "到" + bsne.lng + "," + bsne.lat);

    //加载可视区域内已保存的标点
    showPoints(pointsInfo,bssw,bsne);

});

//点击开始标点
function startPunc(obj){
    $(obj).hide();
    $('.mapc-input').hide();
    $(obj).siblings('button').eq(0).show();
    myDis.open();  //开启鼠标测距
}

//判断标点所属城市
var geoc = new BMap.Geocoder();

//提交标点
function savePoints(obj){
    if(myDis._isOpen && myDis._points.length > 0){
        alert('请结束标点后再提交');
        return false;
    }
    if(pointList.length == 0){
        alert('请标点后再提交');
        return false;
    }
    if(!window.confirm('确定提交吗？提交后，已标点的坐标点无法更改！')){
        setTimeout(function(){
            myDis.open();//点取消，停留在当前页可继续标点
        },500);
        return false;
    }

    var pointStr = '';
    for(var i = 0, len = pointList.length; i < len; i++){
        if(!pointList[i]) continue;
        pointStr += pointList[i]['lng'] + '|' + pointList[i]['lat'] + ',';
    }
    pointStr = pointStr.substr(0,pointStr.length-1);
    $.ajax({
        type:'post',
        url:'./savePoint.php',
        data:{'city':city,'action':'save','pointList':pointStr},
        dataType:'json',
        success:function(data){
            if(data.code == 100){
                alert('保存成功！');
                isPointOver = true;
                myDis.close();//关闭鼠标测距大
                removeOverlay(); //移除覆盖物

                //将保存入库的标点添加到数组中，并展示
                for(var i = 0, len = pointList.length; i < len; i++){
                    pointsInfo.push(pointList[i]);
                }
                pointList = [];
                showPoints(pointsInfo,bssw,bsne);

                $('.l-btn').eq(0).show();
                $('.l-btn').eq(1).hide();
                $('.mapc-input').show();
                return true;
            }else{
                alert(data.msg);
                return false;
            }
        }
    });
}

//显示已保存标点
function showPoints(pointsInfo,bssw,bsne){

    //当地图缩放比例过大时，地图上的点选择性展示，而不再是展示每一个点
    var curZoom = map.getZoom();//获取当前比例尺大小
    var gapsize = 1; //间隔显示点的个数，默认每个点都展示
    if(curZoom < 16 && curZoom > 2){
        gapsize = zoomList[curZoom]/100;
    }

    for(var i = 0,len = pointsInfo.length; i < len; i++){

        var key = pointsInfo[i]['lng']+','+pointsInfo[i]['lat'];
        if(gapsize == 1){
            if(pointsInfo[i]['lng'] >= bssw.lng && pointsInfo[i]['lng'] <= bsne.lng && pointsInfo[i]['lat'] >= bssw.lat && pointsInfo[i]['lat'] <= bsne.lat){
                //坐标点在该展示范围，并且还未标点的，则标点
                if(undefined == addOverlayPoints[key] || !addOverlayPoints[key]){
                    addOverlay(pointsInfo[i]['lng'],pointsInfo[i]['lat'],customStyle.redMarkerSrc);
                }
            }else if(undefined != addOverlayPoints[key] && addOverlayPoints[key] != ''){
                //如果该坐标点不在展示范围就移除
                map.removeOverlay(addOverlayPoints[key]);
                addOverlayPoints[key] = '';
            }
        }else{
            //如果该坐标点不在展示范围,且已标点，需要移除
            if(undefined != addOverlayPoints[key] && addOverlayPoints[key] != ''){
                map.removeOverlay(addOverlayPoints[key]);
                addOverlayPoints[key] = '';
            }

            if(i%gapsize == 0 && pointsInfo[i]['lng'] >= bssw.lng && pointsInfo[i]['lng'] <= bsne.lng && pointsInfo[i]['lat'] >= bssw.lat && pointsInfo[i]['lat'] <= bsne.lat){
                //坐标点在该展示范围，并且还未标点的，则标点
                if(undefined == addOverlayPoints[key] || !addOverlayPoints[key]){
                    addOverlay(pointsInfo[i]['lng'],pointsInfo[i]['lat'],customStyle.redMarkerSrc);
                }
            }
        }

    }
}

//添加标点
function addOverlay(lng,lat,markerSrc){
    var point,newIcon,marker;
    point = new BMap.Point(lng,lat);
    newIcon = new BMap.Icon(markerSrc, new BMap.Size(21, 35));
    marker = new BMap.Marker(point,{icon:newIcon});
    marker.setOffset(new BMap.Size(-2,-15)); //设置标点位置
    map.addOverlay(marker); //添加标点
    addOverlayPoints[lng+','+lat] = marker;
}

//移除标点、直线、文字等
function removeOverlay(){
    for(var i = 0, len = addOverlayList.length; i < len; i++){
        map.removeOverlay(addOverlayList[i]);
    }
}

//根据地点关键字定位
function searchLocation(){
    var keyword = $('#keyword').val();
    if(!keyword) return false;
    var local = new BMap.LocalSearch(map, {
        renderOptions:{map: map},
        pageCapacity:1,
        onSearchComplete: function(results){
            if (local.getStatus() == BMAP_STATUS_SUCCESS){
                var objpoint=results.getPoi(0).point;
                if(!objpoint){
                    alert("不能匹配到位置: " + keyword);
                }else{
                    addOverlay(objpoint.lng,objpoint.lat,customStyle.blueMarkerSrc);
                    map.centerAndZoom(new BMap.Point(objpoint.lng,objpoint.lat), 19);
                }
            }
            local.clearResults();
        }
    });
    //forceLocal表示是否将搜索范围约束在当前城市
    local.search(keyword,{forceLocal:true});
}

