import { Outlet, Link }  from "react-router-dom";

function Layout() {

    return (

        <div className="min-h-screen bg-gray-50  text-gray-900" >
            <header className="border-b bg-white">
                <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
                    <Link to="/" className="font-semibold text-lg">VMSL Team Hub</Link>
                    <div className="text-sm text-gray-600">Team-first stats</div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-4 py-6">
                <Outlet />
            </main>
        </div>

    )

}

export default Layout