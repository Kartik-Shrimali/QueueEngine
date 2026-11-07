import { useState } from "react";

export default function Login({onLogin} : {onLogin : (arg0 : string) => void}) {
    const [password, setPassword] = useState("");

    return <div>
        <form onSubmit= {(e) => {
                e.preventDefault();
                if(password.trim() === "") return;
                onLogin(password.trim());
            }}>
            <input value={password} type="password" onChange={(e) => {
                setPassword(e.target.value);
            }}></input>
            <button>Connect</button>
        </form>
    </div>
}