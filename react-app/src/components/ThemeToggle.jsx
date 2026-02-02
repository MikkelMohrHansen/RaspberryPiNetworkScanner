
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import {cn} from "@/lib/utils";

export const ThemeToggle = () => {
    const[isDarkMode, setIsDarkmode] = useState(false);

    useEffect (() =>{
        const storedTheme = localStorage.getItem("theme")
        if (storedTheme == "dark") {
            setIsDarkmode(true)
            document.documentElement.classList.add("dark");
        } else {
            localStorage.setItem("theme", "light");
            setIsDarkmode(false);
        }
    }, [])

    const toggleTheme = () => {
        if (isDarkMode) {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("theme", "light");
            setIsDarkmode(false);
        } else {
            document.documentElement.classList.add("dark");
            localStorage.setItem("theme", "dark");
            setIsDarkmode(true);
        }
    };

    return (
        <button 
            onClick={toggleTheme} 
            className={cn(
                "fixed max-sm:hidden top-5 right-5 z-50 p-2 rounded-full transistion-colors duration-300",
                "focus:outline-hidden"
        )}
        >
            {isDarkMode ? (
                <Sun className="w-6 h-6 text-yellow-300"/>
            ) : (
                <Moon className="w-6 h-6 text-blue-900" />
            )} 
        </button>
    );   
};
