import { Suspense } from "react";
import SifreYenileme from "./sifreyenileme";

export default function SifreYenile(){
    return(
        <Suspense>
            <SifreYenileme/>
        </Suspense>
    )
}