/*
 * JSON-to-Framer 0.1 (2014-01-16)
 * © 2014 Bruno Bergher
 * Free to use under terms of MIT license
 */

var loadDocs = function(items) {
  var Views = [],
      ViewsByName = {},
      createView;

  createView = function(name, info, superView) {
    // console.log("createView", name, info, superView);
    var viewInfo = { clip: false },
        viewType, viewFrame;

    // Fill in the view name
    info.name = name;

    if (info.image) {
      viewType = ImageView
      name = info.image.filename || info.name
      type = info.imageType || "png"
      viewInfo.image = "images/" + name + "." + type
    } else if (info.scroll) {
      viewType = ScrollView
    } else {
      viewType = View
      viewFrame = info.layerFrame
    }

    // If this layer group has a mask, we take the mask bounds
    // as the frame and clip the layer
    if (info.maskFrame) {
      viewFrame = info.maskFrame
      viewInfo.clip = true

      // If the layer name has "scroll" we make this a scroll view
      if (info.name.toLowerCase().indexOf("scroll") != -1) {
        viewType = ScrollView
      }

      // If the layer name has "paging" we make this a paging view
      if (info.name.toLowerCase().indexOf("paging") != -1) {
        viewType = ui.PagingView
      }
    }

    var view = new viewType(viewInfo)
    view.frame = viewFrame

    // If the view has a contentview (like a scrollview) we add it
    // to that one instead.
    if (superView && superView.contentView) {
      view.superView = superView.contentView
    } else {
      view.superView = superView
    }

    // Basic configuration
    view.name = info.name
    view.viewInfo = info

    // Set position and dimensions
    view.x = info.x;
    view.y = info.y;
    view.width  = info.width;
    view.height = info.height;

    // Set additional properties
    if(info.hasOwnProperty("opacity"))  view.opacity  = info.opacity;
    if(info.hasOwnProperty("rotation")) view.rotation = info.rotation;
    if(info.hasOwnProperty("visible"))  view.visible  = info.visible;
    if(info.hasOwnProperty("clickable")) {
      view.style["pointer-events"] = info.clickable ? "auto" : "none";
    } else {
      view.style["pointer-events"] = "auto";
    }

    // If there are styles, apply them
    if(info.style) {
      for(var s in info.style) {
        view.style[s] = info.style[s]
      }
    }

    // If there's HTML content defined, set it
    if(info.html) {
      view.html = info.html;
    }

    // If there are properties, store them
    if(info.props) {
      view.props = info.props;
    }

    Views.push(view)
    ViewsByName[info.name] = view

    // If the layer name contains draggable we create a draggable for this layer
    if (info.name.toLowerCase().indexOf("draggable") != -1 || info.draggable == true) {
      view.draggable = new ui.Draggable(view)
    }

    for (var child in info.children) {
      createView(child, info.children[child], view)
    }

    // Make dimensions of non-image layers with children
    // and no specificed dimensions fit their children
    if(info.children && viewType != ImageView) {
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
    createView(itemName, items[itemName]);
  }

  return ViewsByName
}