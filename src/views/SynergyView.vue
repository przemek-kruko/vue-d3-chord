<script>
import * as d3 from "d3";
export default {
  data() {
    return {
      addMode: false,
      newPersonName: "",
      persons: [
        { id: 1, name: "John Doe" },
        { id: 2, name: "Amanda Blue" },
        { id: 3, name: "Lord Vader" },
      ],
      synergyTest: 50,
      synergy: [
        {
          id: 1,
          values: [
            { id: 1, value: 0 },
            { id: 2, value: 45 },
            { id: 3, value: 55 },
          ],
        },
        {
          id: 2,
          values: [
            { id: 1, value: 66 },
            { id: 2, value: 0 },
            { id: 3, value: 34 },
          ],
        },
        {
          id: 3,
          values: [
            { id: 1, value: 10 },
            { id: 2, value: 90 },
            { id: 3, value: 0 },
          ],
        },
      ],
    };
  },
  methods: {
    toggleAddPersonMode() {
      this.addMode = !this.addMode;
    },
    handleChangeNewPersonName(event) {
      this.newPersonName = event.target.value;
    },
    addNewPerson() {
      const id = new Date().getTime();
      const name = this.newPersonName;
      if (name.length > 0) {
        this.newPersonName = "";
        this.persons = [...this.persons, { id, name }];
        this.synergy = [
          ...this.synergy.map((synergyItem) => ({
            ...synergyItem,
            values: [...synergyItem.values, { id, value: 0 }],
          })),
          {
            id,
            values: this.persons
              .filter((person) => person.id !== id)
              .map((person) => ({ id: person.id, value: 0 })),
          },
        ];
        this.addMode = false;
        this.$nextTick(() => {
          this.renderChord();
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

      const matrix = this.persons.map((person) => {
        return this.synergy
          .find((synergyItem) => synergyItem.id === person.id)
          .values.map((synergyItemValue) => synergyItemValue.value);
      });
      console.log("matrix", matrix);

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
        .style("fill", "grey")
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
        .style("fill", "#69b3a2")
        .style("stroke", "black");
    },
  },
  mounted() {
    this.renderChord();
  },
};
</script>

<template>
  <div class="row">
    <div class="item">
      <div class="row">
        <div class="item">
          <div>Persons:</div>
          <ul>
            <li v-for="person in persons" :key="person.id">
              {{ person.name }}
              <button @click="() => removePerson(person.id)">[remove]</button>
            </li>
            <li>
              <template v-if="addMode">
                <input
                  type="text"
                  @keydown.enter="addNewPerson"
                  v-model="newPersonName"
                  @input="handleChangeNewPersonName"
                />
                <button @click="addNewPerson">[+]</button>
                <button @click="toggleAddPersonMode">[cancel]</button>
              </template>
              <template v-else>
                <button @click="toggleAddPersonMode">[add]</button>
              </template>
            </li>
          </ul>
        </div>
      </div>
      <div class="item">
        <div>Synergy map:</div>
        <ul>
          <li v-for="person in persons" :key="person.id">
            <div>{{ person.name }}:</div>
            <ul>
              <li
                v-for="person2 in persons.filter(
                  (person3) => person3.id !== person.id
                )"
                :key="person2.id"
              >
                <span>{{ person2.name }}</span>
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
