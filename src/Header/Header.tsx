import React, { useState } from 'react';

import './Header.css'

export interface HeaderProps {
    onChange: (val: string) => void;
}

export const Header: React.FC<HeaderProps> = ({onChange}: HeaderProps) => {

    const [value, setValue] = useState<string>('')

    return <div className="Header">
        <input
            className="Header-TextInput"
            type="text"
            value={value}
            onChange={evt => {
                setValue(evt.target.value)
                onChange(evt.target.value)
            }}
        />
        {!value && <div className="Header-background">
            Enter your request here
        </div>}
    </div>
}