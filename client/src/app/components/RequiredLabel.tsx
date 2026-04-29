import type { LabelHTMLAttributes, ReactNode } from "react";

interface RequiredLabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
    required?: boolean;
    children: ReactNode;
}

export default function RequiredLabel({
    required,
    children,
    className,
    ...props
}: RequiredLabelProps) {
    return (
        <label className={className} {...props}>
            {children}
            {required && <span className="text-red-500"> *</span>}
        </label>
    );
}