import { Outlet, useLocation } from "react-router-dom";
import Footer from "../pages/Shared/Footer/Footer";
import NavBar from "../pages/Shared/NavBar/NavBar";


const Main = () => {
    const location = useLocation();
    console.log(location);
    const hideHeaderFooter = location.pathname.includes('login') || location.pathname.includes('signUp')
    return (
        <div>
            { hideHeaderFooter || <NavBar></NavBar>}
            <Outlet></Outlet>
            { hideHeaderFooter || <Footer></Footer>}
        </div>
    );
};

export default Main;