import Swal from "sweetalert2";
import useAuth from "../../hooks/useAuth";
import { Await, useLocation, useNavigate } from "react-router-dom";
import useAxiosSecure from "../../hooks/useAxiosSecure";
import useCart from "../../hooks/useCart";
import useAdmin from "../../hooks/useAdmin";


const FoodCard = ({ item }) => {
    const { name, image, price, recipe, _id } = item;
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const axiosSecure = useAxiosSecure();
    const [isAdmin] = useAdmin();

    // using axios refetch
    const [cart, refetch] = useCart();

    const handleAddToCart = async () => {
        if (user && user.email) {
            // send cart data to database
            // console.log(user.email);
            const cartItem = {
                menuId: _id,
                email: user.email,
                name,
                image,
                price
            }
            // We could sent this with fetch() bt wanna use Axios
            axiosSecure.post('/carts', cartItem)
            .then(res => {
                console.log(res.data);
                if (res.data.insertedId) {
                    Swal.fire({
                        title: `${name} added to cart`,
                        icon: "success",
                        showConfirmButton: false,
                        draggable: true,
                        timer: 1500
                    });

                    // Refetch the cart to update the number the of cart items
                    try {
                        const refetchResult = refetch();
                        console.log("Cart after refetch:", cart);
                        console.log("Refetch Result:", refetchResult.data); // Log the updated cart

                    } catch (error) {
                        console.error("Error during refetch:", error);
                    }
                }
                
            })
            
        }
        else {
            Swal.fire({
                title: "You are not logged in!",
                text: "Login to add into cart",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#3085d6",
                cancelButtonColor: "#d33",
                confirmButtonText: "Log me in"
            }).then((result) => {
                if (result.isConfirmed) {
                    // redirect to login page
                    navigate("/login", { state: { from: location } });
                }
            });
        }

    }
    return (
        <div className="card w-96 bg-base-100 shadow-xl">
            <figure><img src={image} alt="Shoes" /></figure>
            <p className="absolute right-0 mr-4 mt-4 px-4 bg-slate-900 text-white">{price}<span className="text-2xl">৳</span></p>
            <div className="card-body flex flex-col items-center">
                <h2 className="card-title">{name}</h2>
                <p>{recipe}</p>
                <div className="card-actions justify-end">
                    <button
                        onClick={handleAddToCart}
                        className="btn btn-outline bg-slate-100 border-0 border-b-4 border-orange-400 mt-4"
                        disabled={isAdmin}
                    >
                        Add to Cart
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FoodCard;