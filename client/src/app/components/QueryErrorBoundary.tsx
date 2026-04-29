import React from "react";

interface QueryErrorBoundaryProps {
    children: React.ReactNode;
}

interface QueryErrorBoundaryState {
    hasError: boolean;
    message: string;
}

export class QueryErrorBoundary extends React.Component<
    QueryErrorBoundaryProps,
    QueryErrorBoundaryState
> {
    constructor(props: QueryErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, message: "" };
    }

    static getDerivedStateFromError(error: unknown): QueryErrorBoundaryState {
        const message =
            error instanceof Error ? error.message : "Failed to load data.";
        return { hasError: true, message };
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                    <div className="font-medium">
                        Could not load visit data.
                    </div>
                    <div className="mt-1 text-sm">{this.state.message}</div>
                </div>
            );
        }

        return this.props.children;
    }
}
