import { useQuery } from '@tanstack/react-query';
import useAuth from '../../../../hooks/useAuth'
import useAxiosSecure from '../../../../hooks/useAxiosSecure';
import { TbCurrencyTaka } from "react-icons/tb";
import { FaCartArrowDown, FaUsersBetweenLines } from 'react-icons/fa6';
import { IoFastFoodOutline } from 'react-icons/io5';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, PieChart, Pie, Legend } from 'recharts';

const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', 'cyan', 'pink'];
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];


const AdminHome = () => {
    const { user } = useAuth();
    const axiosSecure = useAxiosSecure();

    const { data: stats } = useQuery({
        queryKey: ['admin-stats'],
        queryFn: async () => {
            const res = await axiosSecure.get('/admin-status');
            return res.data;
        }
    })
    console.log('admin stats:', stats);
    

    const { data: chartData = [] } = useQuery({
        queryKey: ['order-stats'],
        queryFn: async () => {
            const res = await axiosSecure.get('/order-stats');
            return res.data;
        }
    })


    // custom shape for the bar chart
    const getPath = (x, y, width, height) => {
        return `M${x},${y + height}C${x + width / 3},${y + height} ${x + width / 2},${y + height / 3}
  ${x + width / 2}, ${y}
  C${x + width / 2},${y + height / 3} ${x + (2 * width) / 3},${y + height} ${x + width}, ${y + height}
  Z`;
    };

    const TriangleBar = (props) => {
        const { fill, x, y, width, height } = props;

        return <path d={getPath(x, y, width, height)} stroke="none" fill={fill} />;
    };


    // Custom function for pi chart
    const RADIAN = Math.PI / 180;
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    const pieChartData = chartData.map(data => {
        return { name: data.category, value: data.revenue }
    })



    // Get current hour
    const now = new Date();
    const hour = now.getHours();

    // Conditional greeting based on time
    let greeting = 'Hello';
    if (hour >= 5 && hour < 12) {
        greeting = 'Good morning';
    } else if (hour >= 12 && hour < 18) {
        greeting = 'Good afternoon';
    } else {
        greeting = 'Good evening';
    }

    // Format current time as HH:MM AM/PM
    const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <div>
            {/* Centered Greeting Section */}
            <div className="flex flex-col items-center mb-10 mt-2">
                <span className="text-3xl font-bold text-gray-600 mb-2">It's {formattedTime}</span>
                <h2 className="text-4xl font-bold text-center">
                    {greeting}
                    {user?.displayName ? `, ${user.displayName}!` : '! Welcome back'}
                </h2>
            </div>

            {/* Dashboard Status */}
            <div className="stats shadow sm:col">
                <div className="stat">
                    <div className="stat-figure text-primary">
                        <TbCurrencyTaka className='text-4xl'></TbCurrencyTaka >
                    </div>
                    <div className="stat-title">Revenue</div>
                    <div className="stat-value text-primary">{stats?.revenue.toFixed(3)}</div>
                    <div className="stat-desc">21% more than last month</div>
                </div>

                <div className="stat">
                    <div className="stat-figure text-primary-secondary">
                        <FaUsersBetweenLines className='text-2xl'></FaUsersBetweenLines>
                    </div>
                    <div className="stat-title">Customer</div>
                    <div className="stat-value text-secondary">{stats?.users}</div>
                    <div className="stat-desc">21% more than last month</div>
                </div>

                <div className="stat">
                    <div className="stat-figure text-primary">
                        <IoFastFoodOutline className='text-2xl'></IoFastFoodOutline>
                    </div>
                    <div className="stat-title">Menu Items</div>
                    <div className="stat-value text-primary">{stats?.menuItems}</div>
                    <div className="stat-desc">21% more than last month</div>
                </div>

                <div className="stat">
                    <div className="stat-figure text-secondary">
                        <FaCartArrowDown className='text-2xl'></FaCartArrowDown>
                    </div>
                    <div className="stat-title">Orders</div>
                    <div className="stat-value text-secondary">{stats?.orders}</div>
                    <div className="stat-desc">21% more than last month</div>
                </div>
            </div>

            {/* Chart */}
            <div className="flex justify-between items-baseline my-10">

                {/* Bar chart */}
                <div className="w-1/2">
                    <BarChart
                        width={450}
                        height={300}
                        data={chartData}
                        margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 5,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="category" />
                        <YAxis />
                        <Bar dataKey="quantity" fill="#8884d8" shape={<TriangleBar />} label={{ position: 'top' }}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={colors[index % 6]} />
                            ))}
                        </Bar>
                    </BarChart>
                </div>

                {/* Pi chart */}
                <div className="w-1/2">
                    <PieChart width={450} height={300}>
                        <Pie
                            data={pieChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={renderCustomizedLabel}
                            outerRadius={130}
                            fill="#8884d8"
                            dataKey="value"
                        >
                            {pieChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={colors[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Legend></Legend>
                    </PieChart>
                </div>
            </div>
        </div>
    );
};

export default AdminHome;