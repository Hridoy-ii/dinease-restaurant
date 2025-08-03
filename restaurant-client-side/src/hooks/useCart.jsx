import { useQuery } from '@tanstack/react-query';
import useAxiosSecure from './useAxiosSecure';
import useAuth from './useAuth';

const useCart = () => {
        // using tan stack query

        const axiosSecure = useAxiosSecure(); 
        const {user} = useAuth();
        const {refetch, data: cart = [] } = useQuery({
            queryKey: ['cart', user?.email],
            enabled: !!user?.email,
            queryFn: async () => {
                const res = await axiosSecure.get(`/carts?email=${user.email}`);
                console.log("API Response:", res.data); // Check the response

                return res.data;
            }
        })
        return [cart, refetch]; 
    
};

export default useCart;