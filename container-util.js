function findPositionX(obj)
{
    var left = 0;
    if(obj.offsetParent)
    {
        while(1)
        {
          left += obj.offsetLeft;
          if(!obj.offsetParent)
            break;
          obj = obj.offsetParent;
        }
    }
    else if(obj.x)
    {
        left += obj.x;
    }
    return left;
}


function findPositionY(obj)
{
    var top = 0;
    if(obj.offsetParent)
    {
        while(1)
        {
          top += obj.offsetTop;
          if(!obj.offsetParent)
            break;
          obj = obj.offsetParent;
        }
    }
    else if(obj.y)
    {
        top += obj.y;
    }
    return top;
  }


