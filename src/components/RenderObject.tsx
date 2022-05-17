import type { JSXElement } from "@babel/types";
import FormInputVue from "./FormInput.vue";

export default function Render(
  {
    obj,
    objName,
    cid,
    index,
  }: { obj?: any; objName?: string; cid?: string; index: number } = { index: 1 }
): any {
  if(obj === null || (typeof obj === "object" && Object.keys(obj).length < 1)) return 
  function RenderObject(object: any) {
    
    return (
      <div
        style={{ marginLeft: `${index}px` }}
        class="bg-slate-800 p-6 rounded-2xl"
      >
        <div>
          {" "}
          <span class="text-lg font-bold uppercase ">{objName} </span>
        </div>
        {cid && (
          <div>
            <a target="_blank" href={`https://${cid}.ipfs.dweb.link`}>
              CID:{" "}
              <span class="text-sky-500 break-all hover:text-white">{cid}</span>{" "}
            </a>{" "}
          </div>
        )}
        {obj && Object.keys(obj).map((key) => {
          if (typeof obj[key] !== "object") {
            return (
              (
                <div>
                  <FormInputVue
                    label={key}
                    name={key}
                    disabled={true}
                    value={obj[key]}
                    class="first-letter:uppercase text-sky-400"
                  />
                </div>
              )
            );
          } else {
            return <Render obj={obj[key]} objName={key} index={index + 1} />;
          }
        })}
      </div>
    );
  }

  function RenderArray(arr: any) {
    console.log(arr);

    return (arr as any[]).forEach((el) => <RenderObject object={el} />) as any;
  }

  if (Array.isArray(obj)) {
    return <RenderArray arr={obj} />;
  } else {
    return <RenderObject object={obj} />;
  }
}
