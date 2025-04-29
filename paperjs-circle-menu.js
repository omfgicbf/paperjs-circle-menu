(function () {
    "use strict";

    class CircleMenu {
        constructor(
            canvas,
            items,
            config
        ) {
            this.canvas = canvas;
            this.items = items;

            this.config = {
                ...{
                    itemStyle: {},
                    itemTextStyle: {},
                    pointer: {},
                    pointerStyle: {},
                    maxDistance: 300,
                    handleLenRate: 2.4
                },
                ...config
            };

            this.config.itemStyle = {
                ...{
                    fillColor: "black"
                },
                ...config.itemStyle
            };

            this.config.itemTextStyle = {
                ...{
                    fillColor: "white",
                    fontSize: 32,
                    justification: "center",
                },
                ...config.itemTextStyle
            };

            var pointerStyle = { ...config.itemStyle, ...config.pointerStyle };

            this.config.pointerStyle = {
                ...{
                    fillColor: "black",
                    radius: 50
                },
                ...pointerStyle
            };

            paper.setup(this.canvas);

            this.pointer = null;
            this.connections = new paper.Group();
            this.itemPaths = new paper.Group();
            this.textPaths = new paper.Group();

            let self = this;

            paper.view.onClick = (e) => {
                let x = e.point.x / this.canvas.width;
                let y = e.point.y / this.canvas.height;

                console.log("click", { x, y });
            };

            paper.view.onMouseMove = function (event) {
                self.pointer.position = event.point;

                self.drawConnections(self.itemPaths.children);
            };

            paper.view.onResize = function (event) {
                self.drawMenu();
            }

            this.drawMenu();
        }

        drawConnections(paths) {
            this.connections.removeChildren();

            for (var i = 0, l = paths.length; i < l; i++) {
                for (var j = i - 1; j >= 0; j--) {
                    var path = this.metaball(
                        paths[i],
                        paths[j],
                        0.5,
                        this.config.handleLenRate,
                        this.config.maxDistance
                    );

                    if (path) {
                        this.connections.appendTop(path);
                        this.connections.sendToBack();

                        path.removeOnMove();

                        continue;
                    }
                }
            }
        }

        drawItem(item) {
            let x = item.x * this.canvas.width;
            let y = item.y * this.canvas.height;

            let style = { ...this.config.itemStyle, ...item.style };
            let textStyle = { ...this.config.itemTextStyle, ...item.textStyle };

            var itemPath = new paper.Path.Circle({
                center: new paper.Point(x, y),
                radius: item.radius,
                style: style
            });

            var textPath = new paper.PointText({
                style: textStyle,
                content: item.label
            });

            textPath.position = new paper.Point(x, y);

            let clickFn = () => {
                if (typeof item.onClick === "function") {
                    item.onClick();
                }
            };

            itemPath.onClick = clickFn;
            textPath.onClick = clickFn;

            this.itemPaths.addChild(itemPath);
            this.textPaths.addChild(textPath);
        }

        drawMenu() {
            this.itemPaths.removeChildren();
            this.textPaths.removeChildren();

            for (var i = 0; i < this.items.length; i++) {
                this.drawItem(this.items[i]);
            }

            this.drawPointer();

            this.drawConnections(this.itemPaths.children);

            paper.view.requestUpdate();
        }

        drawPointer() {
            this.pointer = new paper.Path.Circle({
                center: [0, 0],
                radius: this.config.pointerStyle.radius,
                style: this.config.pointerStyle
            });

            this.pointer.sendToBack();

            this.itemPaths.appendTop(this.pointer);
        }

        getVector(
            radians,
            length
        ) {
            let point = new paper.Point({
                angle: (radians * 180) / Math.PI,
                length: length
            });

            return point;
        }

        metaball(
            ball1,
            ball2,
            v,
            handleLenRate,
            maxDistance
        ) {
            var center1 = ball1.position;
            var center2 = ball2.position;
            var radius1 = ball1.bounds.width / 2;
            var radius2 = ball2.bounds.width / 2;
            var pi2 = Math.PI / 2;
            var d = center1.getDistance(center2);
            var u1, u2;

            if (radius1 == 0 || radius2 == 0) {
                return;
            }

            if (d > maxDistance || d <= Math.abs(radius1 - radius2)) {
                return;
            } else if (d < radius1 + radius2) {
                u1 = Math.acos(
                    (radius1 * radius1 + d * d - radius2 * radius2) / (2 * radius1 * d)
                );
                u2 = Math.acos(
                    (radius2 * radius2 + d * d - radius1 * radius1) / (2 * radius2 * d)
                );
            } else {
                u1 = 0;
                u2 = 0;
            }

            var centerx = center2.subtract(center1);
            var angle1 = centerx.getAngleInRadians();
            var angle2 = Math.acos((radius1 - radius2) / d);
            var angle1a = angle1 + u1 + (angle2 - u1) * v;
            var angle1b = angle1 - u1 - (angle2 - u1) * v;
            var angle2a = angle1 + Math.PI - u2 - (Math.PI - u2 - angle2) * v;
            var angle2b = angle1 - Math.PI + u2 + (Math.PI - u2 - angle2) * v;
            var p1a = center1.add(this.getVector(angle1a, radius1));
            var p1b = center1.add(this.getVector(angle1b, radius1));
            var p2a = center2.add(this.getVector(angle2a, radius2));
            var p2b = center2.add(this.getVector(angle2b, radius2));

            var totalRadius = radius1 + radius2;

            var pa = p1a.subtract(p2a);
            var d2 = Math.min(v * handleLenRate, pa.length / totalRadius);

            d2 *= Math.min(1, (d * 2) / (radius1 + radius2));

            radius1 *= d2;
            radius2 *= d2;

            var path = new paper.Path({
                segments: [p1a, p2a, p2b, p1b],
                style: ball1.style,
                closed: true
            });

            var segments = path.segments;

            segments[0].handleOut = this.getVector(angle1a - pi2, radius1);
            segments[1].handleIn = this.getVector(angle2a + pi2, radius2);
            segments[2].handleOut = this.getVector(angle2b - pi2, radius2);
            segments[3].handleIn = this.getVector(angle1b + pi2, radius1);

            return path;
        }
    }

    window.CircleMenu = CircleMenu;
})();
