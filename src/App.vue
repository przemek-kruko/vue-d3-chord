<script>
import * as d3 from "d3";
import randomName from "node-random-name";
import seedColor from "seed-color";
import data from "./data/example.json";

export const SynergyView = {
  data() {
    return {
      addMode: false,
      newPersonName: "",
      newPersonColor: "#000000",
      visibilityThreshold: 0,
      persons: [
        ...data.persons.map((item) => {
          const name = `${item.first_name} ${item.last_name}`;
          return {
            id: item.id,
            name,
            color: this.randomColor(name),
          };
        }),
      ],
      synergyTest: 50,
      synergy: [
        ...data.synergy.map((item) => ({
          id: item.id,
          values: item.synergy.map((subitem) => ({
            id: subitem.id,
            value: subitem.result || 0,
          })),
        })),
      ],
    };
  },
  methods: {
    randomColor(id) {
      return seedColor(id).toHex();
    },
    toggleAddPersonMode() {
      this.addMode = !this.addMode;
    },
    handleChangeNewPersonName(event) {
      this.newPersonName = event.target.value;
    },
    handleChangeNewPersonColor(event) {
      this.newPersonColor = event.target.value;
    },
    handleChangeVisibilityThreshold(event) {
      const threshold = Number(event.target.value || 0);
      this.visibilityThreshold = threshold;
      this.$nextTick(() => {
        this.renderChord();
      });
    },
    addPersonEntity(id, name, color, randomValues = false) {
      const max = 100;
      this.persons = [...this.persons, { id, name, color }];
      this.synergy = [
        ...this.synergy.map((synergyItem) => ({
          ...synergyItem,
          values: [
            ...synergyItem.values,
            { id, value: randomValues ? Math.floor(Math.random() * max) : max },
          ],
        })),
        {
          id,
          values: this.persons.map((person) => {
            const value = randomValues ? Math.floor(Math.random() * max) : max;
            return { id: person.id, value: person.id !== id ? value : 0 };
          }),
        },
      ];
      this.$nextTick(() => {
        this.renderChord();
      });
    },
    addGeneratePerson() {
      const id = new Date().getTime();
      const name = randomName();
      const color = this.randomColor(id);
      this.addPersonEntity(id, name, color, true);
    },
    addNewPerson() {
      const id = new Date().getTime();
      const name = this.newPersonName;
      const color = this.newPersonColor;
      if (name.length > 0 && color.length > 0) {
        this.addPersonEntity(id, name, color);
        this.$nextTick(() => {
          this.newPersonName = "";
          this.newPersonColor = "#000000";
          this.addMode = false;
        });
      }
    },
    removePerson(id) {
      this.persons = this.persons.filter((person) => person.id !== id);
      this.synergy = this.synergy
        .filter((synergyItem) => synergyItem.id !== id)
        .map((synergyItem) => ({
          ...synergyItem,
          values: synergyItem.values.filter(
            (synergyItemValue) => synergyItemValue.id !== id
          ),
        }));
      this.$nextTick(() => {
        this.renderChord();
      });
    },
    handleChangeSynergyValue(sourcePerson, targetPerson, value) {
      this.synergy = this.synergy.map((synergyItem) => {
        if (synergyItem.id === sourcePerson) {
          return {
            ...synergyItem,
            values: synergyItem.values.map((synergyItemValue) => {
              if (synergyItemValue.id === targetPerson) {
                return { ...synergyItemValue, value };
              }
              return synergyItemValue;
            }),
          };
        }
        return synergyItem;
      });
      this.$nextTick(() => {
        this.renderChord();
      });
    },
    renderChord() {
      // create the svg area
      const svg = d3.select("#chord g");

      const data = this.persons.map((person) => {
        return this.synergy
          .find((synergyItem) => synergyItem.id === person.id)
          .values.map((synergyItemValue) => synergyItemValue.value);
      });

      const matrix = (data || []).reduce(
        (current, currentValue, currentIndex) => {
          const thresholdedIndexes = currentValue.map((value, i) => {
            const keep = Boolean(value >= this.visibilityThreshold ? value : 0);
            return { keep, i };
          });
          thresholdedIndexes.forEach(({ keep, i }) => {
            if (!keep) {
              current[i][currentIndex] = 0;
              current[currentIndex][i] = 0;
            }
          });

          // console.log({ currentValue, currentIndex, thresholdedIndexes });

          return current;
        },
        data
      );

      // console.log("matrix", matrix);

      const colors = this.persons.map((person) => person.color || "red");

      // give this matrix to d3.chord(): it will calculates all the info we need to draw arc and ribbon
      const res = d3
        .chord()
        .padAngle(0.1) // padding between entities (black arc)
        .sortSubgroups(d3.descending)(matrix);

      svg.selectAll("path").remove();

      // add the groups on the inner part of the circle
      svg
        .datum(res)
        .append("g")
        .selectAll("g")
        .data((d) => d.groups)
        .enter()
        .append("g")
        .append("path")
        .style("fill", (d, i) => colors[i])
        .style("stroke", "black")
        .attr("d", d3.arc().innerRadius(200).outerRadius(210));

      // Add the links between groups
      svg
        .datum(res)
        .append("g")
        .selectAll("path")
        .data((d) => d)
        .enter()
        .append("path")
        .attr("d", d3.ribbon().radius(200))
        .style("fill", (d) => colors[d.source.index])
        .style("stroke", "black");
    },
  },
  mounted() {
    this.renderChord();
  },
};
export default SynergyView;
</script>

<template>
  <div class="row">
    <div class="item">
      <div class="row">
        <div class="item">
          <div>Options:</div>
          <div>
            Visibility threshold:
            <input
              type="number"
              v-model="visibilityThreshold"
              @input="handleChangeVisibilityThreshold"
              min="0"
              max="100"
            />
          </div>
        </div>
        <div class="item">
          <div>Persons:</div>
          <ul>
            <li v-for="person in persons" :key="person.id">
              {{ person.name }}
              <div
                :style="{
                  display: 'inline-block',
                  width: '2rem',
                  height: '1rem',
                  backgroundColor: person.color,
                  border: '1px solid black',
                  verticalAlign: 'middle',
                }"
              ></div>
              <button @click="() => removePerson(person.id)">[remove]</button>
            </li>
            <li>
              <template v-if="addMode">
                <input
                  type="text"
                  v-model="newPersonName"
                  @keydown.enter="addNewPerson"
                  @input="handleChangeNewPersonName"
                />
                <input
                  type="color"
                  v-model="newPersonColor"
                  @input="handleChangeNewPersonColor"
                />
                <button @click="addNewPerson">[+]</button>
                <button @click="toggleAddPersonMode">[cancel]</button>
              </template>
              <template v-else>
                <button @click="toggleAddPersonMode">[add]</button>
                <button @click="addGeneratePerson">[generate]</button>
              </template>
            </li>
          </ul>
        </div>
      </div>
      <div class="item">
        <div>Synergy map:</div>
        <ul>
          <li v-for="person in persons" :key="person.id">
            <div>
              <span>{{ person.name }} </span>:
              <div
                :style="{
                  display: 'inline-block',
                  width: '2rem',
                  height: '1rem',
                  backgroundColor: person.color,
                  border: '1px solid black',
                  verticalAlign: 'middle',
                }"
              ></div>
            </div>
            <ul>
              <li
                v-for="person2 in persons.filter(
                  (person3) => person3.id !== person.id
                )"
                :key="person2.id"
              >
                <span>{{ person2.name }}</span>
                <div
                  :style="{
                    display: 'inline-block',
                    width: '2rem',
                    height: '1rem',
                    backgroundColor: person2.color,
                    border: '1px solid black',
                    verticalAlign: 'middle',
                  }"
                ></div>
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  v-model="
                    synergy
                      .find((item) => item.id === person.id)
                      .values.find((item) => item.id === person2.id).value
                  "
                  @input="
                    (event) =>
                      handleChangeSynergyValue(
                        person.id,
                        person2.id,
                        Number(event.target.value || 0)
                      )
                  "
                />
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </div>

    <div class="item">
      <svg id="chord" width="440" height="440">
        <g style="transform: translate(50%, 50%)"></g>
      </svg>
    </div>
  </div>
</template>

<style>
@media (min-width: 1024px) {
  .row {
    display: flex;
    flex-direction: row;
    width: 100%;
  }
  .item {
    flex: 1;
    width: 100%;
  }
  .test {
    min-height: 100vh;
    display: flex;
    align-items: center;
  }
}
</style>
