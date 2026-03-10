import { useNavigate } from "react-router-dom";

function Home(){
    const navigate = useNavigate(); //changes the url programatically

    const goToSample = () => {
        //navigate("/team/2026/1/bby-selects-w-eagles");
        //navigate("/team/2026/3/east-van-fc");
        navigate("/team/2026/1/bct-rovers-hurricanes-a");
    };

    return(
        <div className="space-y-4">
            <h1 className="text-2xl font-semibold">Find your team</h1>
            <p className="text-gray-600">
                This will become the Year - Division - Team Picker
            </p>

            <button onClick={goToSample} className="rounded-lg bg-black px-4 py-2 text-white">
                Go to sample team hub
            </button>
        </div>
    )
}

export default Home;