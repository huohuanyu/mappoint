<?php

//var_dump($_POST);
//处理逻辑：入库等操作...
echo json_encode(array('code'=>100,'msg'=>iconv('gbk','utf-8','保存成功'),'data'=>$_POST['pointList']));
exit;