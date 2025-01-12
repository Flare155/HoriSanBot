import React from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';

// Define the structure of your data points
interface DataPoint {
  date: string;
  watchTime: number;
  listeningTime: number;
  readingTime: number;
  outputTime: number;  // NEW property for output logs
}

// Main component to render the bar chart
const ImmersionTime: React.FC = () => {
  // Replace this with your actual data source
  const data: DataPoint[] = (window as any).puppeteerData.data;

  // Dynamically calculate the interval for label display based on the data length
  const maxLabels = 10; 
  // Ensure labelInterval is never zero to avoid potential "index % 0" errors
  let rawInterval = Math.ceil(data.length / maxLabels);
  const labelInterval = rawInterval > 0 ? rawInterval : 1;

  // Define the series for the bar chart
  const series = [
    {
      name: 'Watchtime',
      data: data.map((point) => point.watchTime),
    },
    {
      name: 'Listening',
      data: data.map((point) => point.listeningTime),
    },
    {
      name: 'Reading',
      data: data.map((point) => point.readingTime),
    },
    // NEW: Add Output series
    {
      name: 'Output',
      data: data.map((point) => point.outputTime),
    },
  ];

  // Function to generate chart options
  const chartOptions: ApexOptions = {
    chart: {
      type: 'bar',
      height: 900,
      width: 1250, 
      toolbar: { show: false },
      animations: { enabled: false },
      zoom: { enabled: false },
      stacked: true,
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '75%',
        borderRadius: 0,
      },
    },
    dataLabels: { enabled: false },
    stroke: { show: false },
    grid: {
      show: true,
      borderColor: '#333',
      strokeDashArray: 0,
      position: 'back',
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    xaxis: {
      categories: data.map((point, index) =>
        index % labelInterval === 0 ? point.date : ''
      ),
      labels: {
        rotate: 0,
        rotateAlways: false,
        style: {
          fontSize: '25px',
          colors: '#ffffff',
        },
      },
      axisBorder: { show: false },
      axisTicks: { show: true },
    },
    yaxis: {
      title: {
        text: 'Minutes',
        style: {
          fontSize: '30px',
        },
        offsetX: -15,
      },
      labels: {
        style: {
          fontSize: '30px',
          colors: ['#fff'],
        },
        formatter: (value: number) => `${value}`,
      },
    },
    fill: { opacity: 1 },
    tooltip: {
      y: {
        formatter: (val: number) => `${val}`,
      },
    },
    // Add a new color for 'Output', or re-arrange as you see fit
    colors: ['#00E396', '#0090FF', '#FF4560', '#FEB019'],
    legend: {
      fontSize: '40px',
      fontWeight: 700,
      offsetY: -15,
    },
  };

  return (
    <div className="bg-black w-[1250px] h-[900px] p-4">
      <Chart
        options={chartOptions}
        series={series}
        type="bar"
        height={800}
        width={1250}
      />
    </div>
  );
};

export default ImmersionTime;
