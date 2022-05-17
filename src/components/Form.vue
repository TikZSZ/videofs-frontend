<script lang="tsx">
import { defineComponent, ref, useSlots } from "vue";
import type { PropType } from "vue";
import Button from "./Button.vue";

interface P {
  label: string;
  name: string;
  modelValue: string;
}

export default defineComponent({
  data() {
    return {
      state: {} as any,
    };
  },
  props: {
    formTitle: String,
    buttonText: String,
    submit: Function,
    class: String,
  },
  methods: {
    update(k: string, val: string) {
      this.state[k] = val;
    },
    fnRender() {
      return (
        this.$slots &&
        this.$slots.default!().map((el:JSX.Element) => (

          <el
            value={
              this.state[(el.props as P).name]
            }
            update={(val: any) => {
              this.update((el.props as P).name, val);
            }}
          ></el>
        ))
      );
    },
  },
  render() {
    return (
      <>
        <form
        
          onSubmit={(e) => {
            e.preventDefault();
            this.submit!(this.state);
          }}
          class={
            "relative flex flex-col gap-y-6 bg-slate-800 p-10 rounded-3xl " +
            this.class
          }
        >
          <div class="text-center -mt-5 text-h-hover-text font-medium text-2xl">
            {this.formTitle}
          </div>
          {this.fnRender()}
          <Button
            class="self-center hover:bg-sky-500 bg-slate-700"
            text={this.buttonText as string}
          />
        </form>
      </>
    );
  },
});
</script>


