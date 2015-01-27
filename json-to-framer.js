/*
 * JSON-to-Framer 0.2 (2015-01-27)
 * © 2015 Bruno Bergher
 * Free to use under terms of MIT license
 */

var loadDocs = function(items) {
  var layers = [],
      layerMap = {},
      validProps = [
        'brightness',
        'blur',
        'height',
        'opacity',
        'rotation', 'rotationX', 'rotationY', 'rotationZ',
        'scale', 'scaleX', 'scaleY', 'scaleZ',
        'width',
        'x',
        'y',
        'visible'
      ],
      createLayer;

  createLayer = function(name, info, superLayer) {
    // console.log("createLayer", name, info, superLayer);
    var layerInfo = { clip: true },
        layerType, layerFrame;

    // Fill in the view name
    info.name = name;

    // Image
    if (info.image) {
      layerType = ImageView
      name = info.image.filename || info.name
      type = info.imageType || "png"
      layerInfo.image = "images/" + name + "." + type
    } else if (info.scroll) {
      layerType = ScrollView
    } else {
      layerType = View
      layerFrame = info.layerFrame
    }

    // If this layer group has a mask, we take the mask bounds
    // as the frame and clip the layer
    if (info.maskFrame) {
      layerFrame = info.maskFrame
      layerInfo.clip = true

      // If the layer name has "scroll" we make this a scroll view
      if (info.name.toLowerCase().indexOf("scroll") != -1) {
        layerType = ScrollView
      }

      // If the layer name has "paging" we make this a paging view
      if (info.name.toLowerCase().indexOf("paging") != -1) {
        layerType = ui.PagingView
      }
    }

    var view = new layerType(layerInfo)
    view.frame = layerFrame

    // If the view has a contentview (like a scrollview) we add it
    // to that one instead.
    if (superLayer && superLayer.contentView) {
      view.superLayer = superLayer.contentView
    } else {
      view.superLayer = superLayer
    }

    // Basic configuration
    view.name = info.name
    view.layerInfo = info

    // Iterate through properties
    validProps.forEach(function(prop, index){
      if(info.hasOwnProperty(prop)) {
        view[prop] = info[prop];
      }
    });

    // Apply manual styles
    if(info.css) {
      for(var p in info.css) {
        view.style[p] = info.css[p]
      }
    }

    // If there's HTML content defined, set it
    if(info.html) {
      view.html = info.html;
    }

    // Special properties
    if(info.hasOwnProperty("clickable")) {
      view.style["pointer-events"] = info.clickable ? "auto" : "none";
    } else {
      view.style["pointer-events"] = 'auto';
    }

    if(info.hasOwnProperty("bg")) {
      view.backgroundColor = info.bg;
    } else {
      view.backgroundColor = "transparent";
    }

    // If there are data attributes, store them
    // Used for future reference (eg: target position or scale)
    if(info.data) {
      view.data = info.data;
    }

    // If the layer name contains draggable we create a draggable for this layer
    if (info.name.toLowerCase().indexOf("draggable") != -1 || info.draggable == true) {
      view.draggable = new ui.Draggable(view)
    }

    // Add to array and name map and create layers
    layers.push(view)
    layerMap[info.name] = view
    for (var child in info.children) {
      createLayer(child, info.children[child], view)
    }

    // Make dimensions of non-image layers with children
    // and no specificed dimensions fit their children
    if(info.children && layerType != ImageView) {
      if(!info.height || !info.width) {
        var totalHeight = 0,
            totalWidth = 0,
            subview;
        for (var child in view.subViews) {
          subview = view.subViews[child];
          totalHeight = Math.max(totalHeight, subview.y + subview.height);
          totalWidth = Math.max(totalWidth, subview.x + subview.width);
        }
        if(!info.height) view.height = totalHeight;
        if(!info.width)  view.width = totalWidth;
      }
    }
  }

  // Loop through all the passed items
  for (var itemName in items) {
    createLayer(itemName, items[itemName]);
  }

  return layerMap
}