// Fix for react-native-chart-kit LineChart and PieChart issues
export interface ChartConfig {
  backgroundGradientFrom: string;
  backgroundGradientTo: string;
  color: (opacity?: number) => string;
  strokeWidth?: number;
  barPercentage?: number;
  useShadowColorFromDataset?: boolean;
  decimalPlaces?: number;
  propsForDots?: {
    r: string;
    strokeWidth: string;
    stroke: string;
  };
}

export interface LineChartData {
  labels: string[];
  datasets: Array<{
    data: number[];
    color?: (opacity: number) => string;
    strokeWidth?: number;
  }>;
}

export interface PieChartData {
  name: string;
  population: number;
  color: string;
  legendFontColor: string;
  legendFontSize: number;
}

export interface ChartProps {
  data: LineChartData | PieChartData[];
  width: number;
  height: number;
  chartConfig?: ChartConfig;
  style?: any;
  withDots?: boolean;
  withShadow?: boolean;
  withInnerLines?: boolean;
  withOuterLines?: boolean;
  withVerticalLines?: boolean;
  withHorizontalLines?: boolean;
  accessor?: string;
  backgroundColor?: string;
  paddingLeft?: string;
  absolute?: boolean;
}