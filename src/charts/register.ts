import { BarController, BarElement, Chart, Filler, Legend, LineController, LineElement, LinearScale, PointElement, Title, Tooltip } from "chart.js";

Chart.register(LineController, LineElement, PointElement, BarController, BarElement, Filler, LinearScale, Title, Tooltip, Legend);