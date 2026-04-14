
const SVGNS = 'http://www.w3.org/2000/svg';

const pieChart = {
    calculateSectors(data, total, size, legend) {
        const _roundFloat = (number, decimals) => {
            return (Math.round(number * Math.pow(10, decimals)) / Math.pow(10, decimals)).toFixed(decimals);
        };

        const sectors = [];
        const l = size / 2;
        let a = 0; // Angle
        let aRad = 0;
        let z = 0;
        let x = 0;
        let y = 0;
        let X = 0;
        let Y = 0;
        let R = 0;

        Object.values(data).forEach((value, index) => {
            let percentage = (value > 0) ? parseFloat(_roundFloat(value / total, 2)) : 0;
            let arcSweep;

            // Hack: if percentage is exactly 1, set to 0.9999 to draw full circle
            percentage = (percentage === 1) ? 0.9999 : percentage;

            a = 360 * percentage;
            const aCalc = (a > 180) ? 360 - a : a;
            aRad = aCalc * Math.PI / 180;
            z = Math.sqrt(2 * l * l - (2 * l * l * Math.cos(aRad)));
            if (aCalc <= 90) {
                x = l * Math.sin(aRad);
            } else {
                x = l * Math.sin((180 - aCalc) * Math.PI / 180);
            }

            y = Math.sqrt(z * z - x * x);
            Y = y;

            if (a <= 180) {
                X = l + x;
                arcSweep = 0;
            } else {
                X = l - x;
                arcSweep = 1;
            }

            sectors.push({
                percentage,
                color: legend[index].color,
                arcSweep,
                L: l,
                X,
                Y,
                R
            });

            R = R + a;
        });
        return sectors;
    },

    renderClusters(pieChartParams, markerClusterGroupOptions, pieChartLegend) {
        const L = window.L; // Leaflet is global
        return L.markerClusterGroup({
            ...markerClusterGroupOptions,
            iconCreateFunction: (cluster) => {
                const clusterMarkers = cluster.getAllChildMarkers();
                const distribution = {};
                let answersTotal = 0;

                Object.keys(pieChartParams.possibleAnswersHashMap).forEach((answerRef) => {
                    distribution[answerRef] = 0;
                    clusterMarkers.forEach((marker) => {
                        if (marker.options.possible_answers && marker.options.possible_answers[answerRef]) {
                            distribution[answerRef]++;
                            answersTotal++;
                        }
                    });
                });

                const donutSize = (parseInt(answersTotal.toString().length, 10) + 2) * 10;
                const sectors = pieChart.calculateSectors(distribution, answersTotal, donutSize, pieChartLegend);
                return L.divIcon({
                    html: pieChart.getClusterPieChartSVG(donutSize, sectors, answersTotal),
                    iconSize: new L.Point(donutSize, donutSize)
                });
            }
        });
    },

    getClusterPieChartSVG(donutSize, sectors, answersTotal) {
        const newSVG = document.createElementNS(SVGNS, 'svg');
        newSVG.setAttributeNS(null, 'style', `width: ${donutSize}px; height: ${donutSize}px`);

        let sectorPercentage = 0;
        sectors.forEach((sector) => {
            sectorPercentage += sector.percentage;
            const newSector = document.createElementNS(SVGNS, 'path');
            newSector.setAttributeNS(null, 'fill', sector.color);
            newSector.setAttributeNS(null, 'd', `M${sector.L},${sector.L} L${sector.L},0 A${sector.L},${sector.L} 0 ${sector.arcSweep},1 ${sector.X}, ${sector.Y} z`);
            newSector.setAttributeNS(null, 'transform', `rotate(${sector.R}, ${sector.L}, ${sector.L})`);
            newSVG.appendChild(newSector);
        });

        const midCircle = document.createElementNS(SVGNS, 'circle');
        midCircle.setAttributeNS(null, 'cx', donutSize * 0.5);
        midCircle.setAttributeNS(null, 'cy', donutSize * 0.5);
        if (sectorPercentage > 0) {
            midCircle.setAttributeNS(null, 'r', donutSize * 0.28);
            midCircle.setAttributeNS(null, 'fill', '#fff');
        } else {
            midCircle.setAttributeNS(null, 'r', donutSize / 2);
            midCircle.setAttributeNS(null, 'fill', '#C159B3');
        }

        const newText = document.createElementNS(SVGNS, 'text');
        newText.setAttributeNS(null, 'x', donutSize * 0.5);
        newText.setAttributeNS(null, 'y', donutSize * 0.5);
        newText.setAttributeNS(null, 'dy', '.35em');
        newText.setAttributeNS(null, 'font-size', 12);
        newText.setAttributeNS(null, 'text-anchor', 'middle');
        newText.setAttributeNS(null, 'class', 'clusterMarkersTotal');
        newText.appendChild(document.createTextNode(answersTotal));

        newSVG.appendChild(midCircle);
        newSVG.appendChild(newText);

        return new XMLSerializer().serializeToString(newSVG);
    },

    getSimplePieChartSVG(donutSize, sectors) {
        const newSVG = document.createElementNS(SVGNS, 'svg');
        newSVG.setAttributeNS(null, 'style', `width: ${donutSize}px; height: ${donutSize}px`);
        sectors.forEach((sector) => {
            const newSector = document.createElementNS(SVGNS, 'path');
            newSector.setAttributeNS(null, 'fill', sector.color);
            newSector.setAttributeNS(null, 'd', `M${sector.L},${sector.L} L${sector.L},0 A${sector.L},${sector.L} 0 ${sector.arcSweep},1 ${sector.X}, ${sector.Y} z`);
            newSector.setAttributeNS(null, 'transform', `rotate(${sector.R}, ${sector.L}, ${sector.L})`);
            newSVG.appendChild(newSector);
        });
        return new XMLSerializer().serializeToString(newSVG);
    },

    getPieChartLegend(pieChartParams) {
        const sectorColors = [];
        Object.entries(pieChartParams.possibleAnswersHashMap).forEach(([answerRef, answer]) => {
            sectorColors.push({
                color: pieChart.getRandomColor(),
                answerRef,
                answer
            });
        });
        return sectorColors;
    },

    getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }
};

export default pieChart;
