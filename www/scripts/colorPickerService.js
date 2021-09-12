function colorPickerService() {

    //color picker 
    var colorPickerHandler = {

        //selected color
        selectedColor: null,

        //modal version visibility
        colorPickerModalVisible: false,
        showColorPicker: function (value) {
            colorPickerHandler.colorPickerModalVisible = value;
        },

        //set a color as selected and call the callback, if exists
        setSelectedColor: function (hex) {
            if (hex.indexOf("#") != 0) return;
            colorPickerHandler.selectedColor = hex;

            if (colorPickerHandler.onColorSelected) colorPickerHandler.onColorSelected();
        },

        convertHex: function (hex, opacity) {
            if (!hex) return { r: 0, g: 0, b: 0, a: 1 };
            hex = hex.replace('#', '');
            r = parseInt(hex.substring(0, 2), 16);
            g = parseInt(hex.substring(2, 4), 16);
            b = parseInt(hex.substring(4, 6), 16);
            return { r: r, g: g, b: b, a: opacity / 100.0 };
        },

        getRGBAString: function (rgba) {
            return "rgba(" + rgba.r + ", " + rgba.g + ", " + rgba.b + "," + rgba.a + ")";
        },

        //generate base 64 image from a color
        generateBase64Color: function (hex) {
            //var hex = colorPickerHandler.selectedColor;
            var canvas = document.createElement('canvas');
            var ctx = canvas.getContext('2d');
            canvas.width = 1;
            canvas.height = 1;

            // for simplicity, assume the input is in rgba format
            function createPixel(rgba) {
                ctx.fillStyle = 'rgba(' + [rgba.r, rgba.g, rgba.b, rgba.a].join() + ')';
                ctx.fillRect(0, 0, 1, 1);
                // 'data:image/png;base64,'.length => 22
                return canvas.toDataURL('image/png', '');
            }

            var rgba = colorPickerHandler.convertHex(hex, 100.0);
            return createPixel(rgba);
        },

        //available colors
        colors: [
            "#FFFFFF",
            "#A0A0A0",
            "#494949",
            "#000000",
            "#D8D8FF",
            "#5A5AFF",
            "#00009C",
            "#000054",
            "#A2FFA2",
            "#24FF24",
            "#00A500",
            "#005D00",
            "#FFFFA2",
            "#FFFF24",
            "#9C9C00",
            "#5D5D00",
            "#FFA2A2",
            "#FF2424",
            "#A50000",
            "#5D0000"
        ], 

        namedColors: {
            add: function(name, color){
                this.list[name] = color;
            },
            get: function (name) {
                //return black by default
                if (!this.list[name]) return "#FFFFFF";

                return this.list[name];
            },
            list: {
                "text": "#b8c1cf",
                "dialog": "#4b515f",
                "main": "#ff5f00",
                "belt": "#515763",
                "background": "#36373C"
            }
        },
    }

    return colorPickerHandler;
}