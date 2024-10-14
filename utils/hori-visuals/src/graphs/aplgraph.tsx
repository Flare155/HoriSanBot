import Chart from 'react-apexcharts'
import { abbreviateNumber } from "js-abbreviation-number";

interface ApexOptions {
annotations?: ApexAnnotations
chart?: ApexChart
colors?: any[]
dataLabels?: ApexDataLabels
fill?: ApexFill
forecastDataPoints?: ApexForecastDataPoints
grid?: ApexGrid
labels?: string[]
legend?: ApexLegend
markers?: ApexMarkers
noData?: ApexNoData
plotOptions?: ApexPlotOptions
responsive?: ApexResponsive[]
series?: ApexAxisChartSeries | ApexNonAxisChartSeries
states?: ApexStates
stroke?: ApexStroke
subtitle?: ApexTitleSubtitle
theme?: ApexTheme
title?: ApexTitleSubtitle
tooltip?: ApexTooltip
xaxis?: ApexXAxis
yaxis?: ApexYAxis | ApexYAxis[]
}


interface DataPoint {
    totalPoints:number;
    date:string;
}

export const chartOptions = (data:DataPoint[]) => {
    const ApexOptions:ApexOptions = {
    fill: {
    type: "gradient",
        gradient: {
            type: "diagonal2",
            shade: 'dark',
            colorStops: [
                {
                    offset: 0,
                    color: '#FF0000',
                    opacity: 1,
                },
                {
                    offset: 100,
                    color: '#5500FF',
                    opacity: 1,
                },
            ]
        }
    },
    chart: {
        height: "500px",
        animations: {
            enabled: false,
        },
        id: 'apex-chart',
        type: 'area',
        toolbar: {
            show: false,
        },
        zoom: {
            enabled: false,
        },
    },
    
    dataLabels: {
        enabled: false,
    },
    stroke: {
        width: 1,
        colors: ['#FFFFFF'],
        curve: "monotoneCubic",
    },
    grid: {
        borderColor: '#00000000',
        strokeDashArray: 10,
    },
    xaxis: {
        categories: data.map(x => x.date),
        labels: {
            rotate: 0,
            rotateAlways: false,
            style: {
                fontSize: '15px',
                colors: '#ffffff',
            },

        },
        axisBorder: {
            show: false,
        },
        axisTicks: {
            show: false,
        },
    },
    yaxis: {
        labels: {
            
            style: {
                fontSize: '15px',
                colors: ['#fff'],
            },
            formatter: function(value) {
                return abbreviateNumber(value as any as number, 1);
            },
        },
        axisBorder: {
            show: false,
        },
        axisTicks: {
            show: false,
        },
    },
    tooltip: {
        enabled: false,
    },
    markers: {
        size: 3,
        colors: '#FFFFFF',
    },

}
    return ApexOptions;

};

function ImmersionTime() {

    const data:DataPoint[] = ((window as any).puppeteerData as any).data ?? [];

    const series:ApexAxisChartSeries = 
    [
        {
            name: 'series-1',
            data: data.map(x => x.totalPoints),
        } as any // workaround for ApexCharts
    ];


  return (
    <div className="bg-black w-[500px] h-[500px]">
        <h1>
            <Chart series={series} options={chartOptions(data)}></Chart>
        </h1>
    </div>
  )
}

export default ImmersionTime