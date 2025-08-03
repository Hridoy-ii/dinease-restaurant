import { FaRegEdit, FaTrash } from "react-icons/fa";
import SectionTitle from "../../../components/SectionTitle/SectionTitle";
import useMenu from "../../../hooks/useMenu";
import Swal from "sweetalert2";
import useAxiosSecure from "../../../hooks/useAxiosSecure";
import { Link } from "react-router-dom";


const ManageItems = () => {

    const axiosSecure = useAxiosSecure();

    const [menu, , refetch] = useMenu();

    const handleUpdateItem = () => {
        // update item and send it to database then refetch
    }

    const handleDeleteItem = (item)=>{
        // delete item from the database then refetch

        Swal.fire({
            title: "Are you sure?",
            text: "You won't be able to revert this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, delete it!"
        }).then( async (result) => {
            if (result.isConfirmed) {
                const res = await axiosSecure.delete(`/menu/${item._id}`);
                console.log(res.data);
                
                refetch();

                Swal.fire({
                    position: "top-end",
                    icon: "success",
                    title: `${item.name} has been deleted`,
                    showConfirmButton: false,
                    timer: 1500
                });

                
            }
        });
    }


    return (
        <div>
            <SectionTitle heading="Manage All Item" subHeading="Hurry up" ></SectionTitle>
            <div>
                <div className="overflow-x-auto">
                    <table className="table w-full">
                        {/* head */}
                        <thead>
                            <tr>
                                <th>

                                </th>
                                <th>Item Image</th>
                                <th>Item Name</th>
                                <th>Price</th>
                                <th>Update</th>
                                <th>Delete</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Menu Item loop through */}
                            {
                                menu.map((item, index) =>
                                    <tr key={item._id}>
                                        <td>
                                            {index + 1}
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div className="avatar">
                                                    <div className="mask mask-squircle h-12 w-12">
                                                        <img
                                                            src={item.image}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            {item.name}
                                        </td>
                                        <td className="text-right">{item.price} <span className="text-2xl">৳</span></td>
                                        <td>
                                            <Link to={`/dashboard/updateItem/${item._id}`}>
                                                <button onClick={() => handleUpdateItem(item)}
                                                    className="btn btn-ghost btn-lg ">
                                                    <FaRegEdit className="text-white text-lg"></FaRegEdit>
                                                </button>
                                            </Link>
                                        </td>
                                        <td>
                                            <button onClick={() => handleDeleteItem(item)}
                                                className="btn btn-ghost btn-lg text-red-700">
                                                <FaTrash></FaTrash>
                                            </button>
                                        </td>
                                    </tr>
                                )
                            }

                        </tbody>

                    </table>
                </div>
            </div>
        </div>
    );
};

export default ManageItems;