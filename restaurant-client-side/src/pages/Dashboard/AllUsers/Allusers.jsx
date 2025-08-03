import { useQuery } from "@tanstack/react-query";
import useAxiosSecure, {  } from "../../../hooks/useAxiosSecure";
import { FaTrash, FaUsers } from "react-icons/fa6";
import Swal from "sweetalert2";


const Allusers = () => {

    const axiosSecure = useAxiosSecure();

    const { data: users = [], refetch } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const res = await axiosSecure.get('/users');
            return res.data;
        }
    })

    const handleMakeAdmin = user =>{
        axiosSecure.patch(`/users/admin/${user._id}`)
        .then(res =>{
            console.log(res.data);
            if(res.data.modifiedCount > 0){
                refetch();
                Swal.fire({
                    position: "top-end",
                    icon: "success",
                    title: `${user.name}'s role has been updated to an Admin!`,
                    showConfirmButton: false,
                    timer: 1500
                });
            }
            
        })
    }


    // to do make event handler for user management
    // const handleManageUser = user => {

    // }

    const handleDeleteUser = user =>{

        Swal.fire({
            title: "Are you sure?",
            text: "You won't be able to revert this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, delete it!"
        }).then((result) => {
            if (result.isConfirmed) {
                axiosSecure.delete(`/users/${user._id}`)
                    .then(res => {
                        if (res.data.deletedCount > 0) {
                            refetch();
                            Swal.fire({
                                title: "Deleted!",
                                text: "Your file has been deleted.",
                                icon: "success",
                                timer: "1000"
                            });
                        }

                    })
            }
        });
    }

    return (
        <div>
            <div className="flex justify-evenly my-6">
                <h2>All Users</h2>
                <h2>Total users: {users?.length}</h2>
            </div>

            <div>
                <div className="overflow-x-auto">
                    <table className="table w-full">
                        {/* head */}
                        <thead>
                            <tr>
                                <th></th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {
                                users.map((user, index) => <tr key={user._id}>
                                    <th>{index + 1}</th>
                                    <td>{user.name}</td>
                                    <td>{user.email}</td>
                                    <td>
                                        { user.role === 'admin' ? 'Admin' : <button onClick={() => handleMakeAdmin(user)}
                                            className="btn btn-lg bg-orange-600">
                                            <FaUsers className="text-white text-xl"></FaUsers>
                                        </button>}
                                    </td>
                                    <td>
                                        <button onClick={() => handleDeleteUser(user)} 
                                        className="btn btn-ghost btn-lg text-red-700">
                                        <FaTrash></FaTrash>
                                        </button>
                                    </td>
                                </tr>)
                            }

                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
};

export default Allusers;