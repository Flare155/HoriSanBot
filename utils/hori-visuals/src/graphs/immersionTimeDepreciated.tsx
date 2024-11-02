// src/graphs/ImmersionTime.tsx

import React from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';

// Define the structure of your data points
interface DataPoint {
  date: string;
  watchTime: number | null;
  listeningTime: number | null;
  readingTime: number | null;
}

// Main component to render the bar chart
const ImmersionTime: React.FC = () => {
  // Replace this with your actual data source
  const data: DataPoint[] = [
    { date: '-30', watchTime: null, listeningTime: null, readingTime: 10 },
    { date: '-29', watchTime: 80, listeningTime: 50, readingTime: 40 },
    { date: '-28', watchTime: null, listeningTime: 70, readingTime: 50 },
    { date: '-27', watchTime: 60, listeningTime: null, readingTime: 70 },
    { date: '-26', watchTime: null, listeningTime: null, readingTime: null },
    { date: '-25', watchTime: 100, listeningTime: 80, readingTime: 60 },
    { date: '-24', watchTime: null, listeningTime: 90, readingTime: 60 },
    { date: '-23', watchTime: 75, listeningTime: null, readingTime: 50 },
    { date: '-22', watchTime: 90, listeningTime: 70, readingTime: 60 },
    { date: '-21', watchTime: null, listeningTime: 100, readingTime: 10 },
    { date: '-20', watchTime: 70, listeningTime: 60, readingTime: 10 },
    { date: '-19', watchTime: null, listeningTime: 120, readingTime: 80 },
    { date: '-18', watchTime: 80, listeningTime: null, readingTime: 50 },
    { date: '-17', watchTime: null, listeningTime: null, readingTime: null },
    { date: '-16', watchTime: 150, listeningTime: 100, readingTime: 80 },
    { date: '-15', watchTime: null, listeningTime: null, readingTime: null },
    { date: '-14', watchTime: 90, listeningTime: 60, readingTime: null },
    { date: '-13', watchTime: null, listeningTime: 70, readingTime: 60 },
    { date: '-12', watchTime: 100, listeningTime: null, readingTime: 60 },
    { date: '-11', watchTime: null, listeningTime: 150, readingTime: 90 },
    { date: '-10', watchTime: 120, listeningTime: 80, readingTime: 70 },
    { date: '-9', watchTime: null, listeningTime: null, readingTime: null },
    { date: '-8', watchTime: 60, listeningTime: 50, readingTime: null },
    { date: '-7', watchTime: null, listeningTime: 90, readingTime: 60 },
    { date: '-6', watchTime: 80, listeningTime: null, readingTime: 50 },
    { date: '-5', watchTime: null, listeningTime: 200, readingTime: 150 },
    { date: '-4', watchTime: 110, listeningTime: 80, readingTime: null },
    { date: '-3', watchTime: null, listeningTime: null, readingTime: 100 },
    { date: '-2', watchTime: 120, listeningTime: 100, readingTime: 80 },
    { date: '-1', watchTime: null, listeningTime: 180, readingTime: 150 },
  ];
  
  
  

  // Sanitize data to replace 0 with null to prevent gaps in the stack
  const sanitizedData: DataPoint[] = data.map((point) => ({
    watchTime: point.watchTime === 0 ? null : point.watchTime,
    listeningTime: point.listeningTime === 0 ? null : point.listeningTime,
    readingTime: point.readingTime === 0 ? null : point.readingTime,
    date: point.date,
  }));

  // Define the series for the bar chart
  const series = [
    {
      name: 'Watchtime',
      data: sanitizedData.map((point) => point.watchTime),
    },
    {
      name: 'Listening',
      data: sanitizedData.map((point) => point.listeningTime),
    },
    {
      name: 'Reading',
      data: sanitizedData.map((point) => point.readingTime),
    },
  ];

  // Function to generate chart options
  const chartOptions: ApexOptions = {
    chart: {
      type: 'bar',
      height: 350,
      toolbar: {
        show: false,
      },
      animations: {
        enabled: false,
      },
      zoom: {
        enabled: false,
      },
      stacked: true,
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '85%', // Full width to prevent gaps
        borderRadius: 0, // No border radius for seamless stacking
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: false, // Remove borders between bars
    },
    grid: {
        show: true,
        borderColor: '#333', // Dark grid lines for visibility
        strokeDashArray: 0,
        position: 'back',
        xaxis: {
          lines: {
            show: false, // Hide vertical grid lines
          },
        },
        yaxis: {
          lines: {
            show: true, // Show horizontal grid lines
          },
        },
    },      
    xaxis: {
      categories: sanitizedData.map((point, index) => // This isnt working right but it looks ok
        index % 5 === 0 ? point.date : ''
      ),
      labels: {
        rotate: 0,
        rotateAlways: false,
        style: {  
          fontSize: '25px',
          colors: '#ffffff',
        },
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: true,
      },
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
    fill: {
      opacity: 1,
    },
    tooltip: {
      y: {
        formatter: (val: number) => `${val}`,
      },
    },
    colors: ['#00E396', '#0090FF', '#FF4560'],
    legend: {
      fontSize: '40px',
      fontWeight: 700, // Using numeric value for font weight
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
      />
    </div>
  );
};

export default ImmersionTime;
