// GENERATED from the Airtable Meta API (base app4vhhWMbRFOloOU) — do not hand-edit.
// Which tables link to which, both directions. A write to one table can change
// lookup/rollup values in its linked tables, so cache invalidation after a write
// clears the written table and these neighbours (see invalidateTable in lib/airtable.ts).
// Regenerate when link fields are added: node scripts/generate-table-links.mjs

export const TABLE_NAMES: Record<string, string> = {
  "tbldeKGlLgRWSIzTh": "⚪️ Form Submissions",
  "tblpOwt2GB1YE2bm3": "⚪️ Leads",
  "tblP55kxIOrh8O5Ut": "⚪️ Intake Proposals",
  "tbldBIfAeRAunipbk": "⚪️ Quotes",
  "tblBrtvazPOkXrB80": "⚪️ Invoices",
  "tblZq696m9iqO30ps": "⚪️ Internal Commission Tracker",
  "tblqhGm5GphLg982W": "🟢 Products",
  "tblkb03JiSuxi7Hkf": "🟢 Sagas",
  "tbl0VEFw95zHBUK7s": "🟢 Epics",
  "tblgd7iKw2KdPBkn2": "🟢 Stories",
  "tbleikKz5Tt8tSc0J": "🟢 Sprint Capacity",
  "tblvzdxVq7drJtobt": "🔵 Team Task Payments",
  "tblq1Sa3bCnP9QfAj": "🔵 Accounts",
  "tblhQ9jkgVAuG97gg": "🔵 Airvues Expenses",
  "tblZnJdKLwgj5GMOb": "🔵 Subscriptions",
  "tbl5uOWiDquJWhNuk": "🔘 Team Calendar",
  "tbl1SGvoFaxkeMXfi": "🔘 Agenda",
  "tbl5x2jqUPHcAoKci": "🔘 Team Resource Allocation & Daily Standups",
  "tbluN9YQjm0X3ju1n": "🔘 Daily Report",
  "tbl4GlNscZUI3XXwU": "🔘 Client Feedback",
  "tbl5wqfJ8aEr3fFP7": "Partners",
  "tblMyUwA9bV97CIRC": "Slides",
  "tblixAL658VYnMKOz": "⚙️ Sprints",
  "tblQ3hxcIEUQPLN6f": "⚙️ Companies",
  "tbl9wvZY9M7Y7hcf1": "⚙️ People",
  "tbldZdb78jWBtMCJf": "⚙️Template Phases",
  "tbl8CwaqL8D612q3u": "⚙️ Template Milestone",
  "tblOoGvdG5TAb3xTn": "⚙️ Countries",
  "tblqGfxK5hEksslVF": "⚙️ Software",
  "tblKfmzZ0LtndU0CO": "🔵 Time Entries",
  "tblXOnnKNoozGPMLG": "⚙️ Document Templates",
  "tbllf6QE3WJTtadtN": "Proposal Philosophy Airvues",
  "tblyEBApY1hwIU19o": "Recordings",
  "tblhlUUpmLsGQfLPC": "Meetings",
  "tbliI4lRYA5AlpEzH": "Project Log",
  "tblpRP3I6FrH7XQkY": "🟣 Partner Application",
  "tblVLxiBdOaWwyKA9": "🟣 Partner Application Evidence",
  "tblT6U9M9EFa4lKu0": "⚙️ Retainer Tiers",
  "tblRBsPqSvzvAuSyY": "🟣 Retainer Requests",
  "tblIdtmSzkerb9xUS": "🟣 Retainer Request Comments"
};

export const TABLE_LINKS: Record<string, string[]> = {
  "tbldeKGlLgRWSIzTh": [
    "tbl1SGvoFaxkeMXfi",
    "tbl4GlNscZUI3XXwU",
    "tbl5uOWiDquJWhNuk",
    "tbl5x2jqUPHcAoKci",
    "tbl9wvZY9M7Y7hcf1",
    "tblBrtvazPOkXrB80",
    "tblOoGvdG5TAb3xTn",
    "tblP55kxIOrh8O5Ut",
    "tblQ3hxcIEUQPLN6f",
    "tbldBIfAeRAunipbk",
    "tblqGfxK5hEksslVF"
  ],
  "tblpOwt2GB1YE2bm3": [
    "tbl9wvZY9M7Y7hcf1",
    "tbldBIfAeRAunipbk",
    "tblhlUUpmLsGQfLPC",
    "tblyEBApY1hwIU19o"
  ],
  "tblP55kxIOrh8O5Ut": [
    "tbl9wvZY9M7Y7hcf1",
    "tbldeKGlLgRWSIzTh"
  ],
  "tbldBIfAeRAunipbk": [
    "tbl4GlNscZUI3XXwU",
    "tbl9wvZY9M7Y7hcf1",
    "tblBrtvazPOkXrB80",
    "tblQ3hxcIEUQPLN6f",
    "tblRBsPqSvzvAuSyY",
    "tblT6U9M9EFa4lKu0",
    "tbldBIfAeRAunipbk",
    "tbldeKGlLgRWSIzTh",
    "tblgd7iKw2KdPBkn2",
    "tbliI4lRYA5AlpEzH",
    "tblpOwt2GB1YE2bm3",
    "tblyEBApY1hwIU19o"
  ],
  "tblBrtvazPOkXrB80": [
    "tbl9wvZY9M7Y7hcf1",
    "tblBrtvazPOkXrB80",
    "tblZq696m9iqO30ps",
    "tbldBIfAeRAunipbk",
    "tbldeKGlLgRWSIzTh",
    "tblvzdxVq7drJtobt"
  ],
  "tblZq696m9iqO30ps": [
    "tblBrtvazPOkXrB80",
    "tblgd7iKw2KdPBkn2"
  ],
  "tblqhGm5GphLg982W": [
    "tbl1SGvoFaxkeMXfi",
    "tbl9wvZY9M7Y7hcf1",
    "tblQ3hxcIEUQPLN6f",
    "tblkb03JiSuxi7Hkf"
  ],
  "tblkb03JiSuxi7Hkf": [
    "tbl0VEFw95zHBUK7s",
    "tblqhGm5GphLg982W"
  ],
  "tbl0VEFw95zHBUK7s": [
    "tbl9wvZY9M7Y7hcf1",
    "tblgd7iKw2KdPBkn2",
    "tblkb03JiSuxi7Hkf"
  ],
  "tblgd7iKw2KdPBkn2": [
    "tbl0VEFw95zHBUK7s",
    "tbl9wvZY9M7Y7hcf1",
    "tblKfmzZ0LtndU0CO",
    "tblRBsPqSvzvAuSyY",
    "tblZq696m9iqO30ps",
    "tbldBIfAeRAunipbk",
    "tbleikKz5Tt8tSc0J",
    "tblgd7iKw2KdPBkn2",
    "tblixAL658VYnMKOz",
    "tblvzdxVq7drJtobt",
    "tblyEBApY1hwIU19o"
  ],
  "tbleikKz5Tt8tSc0J": [
    "tbl9wvZY9M7Y7hcf1",
    "tblgd7iKw2KdPBkn2",
    "tblixAL658VYnMKOz"
  ],
  "tblvzdxVq7drJtobt": [
    "tblBrtvazPOkXrB80",
    "tblgd7iKw2KdPBkn2",
    "tblhQ9jkgVAuG97gg"
  ],
  "tblq1Sa3bCnP9QfAj": [
    "tblqGfxK5hEksslVF"
  ],
  "tblhQ9jkgVAuG97gg": [
    "tbl9wvZY9M7Y7hcf1",
    "tblvzdxVq7drJtobt"
  ],
  "tblZnJdKLwgj5GMOb": [],
  "tbl5uOWiDquJWhNuk": [
    "tbldeKGlLgRWSIzTh"
  ],
  "tbl1SGvoFaxkeMXfi": [
    "tbl9wvZY9M7Y7hcf1",
    "tbldeKGlLgRWSIzTh",
    "tblqhGm5GphLg982W"
  ],
  "tbl5x2jqUPHcAoKci": [
    "tbl9wvZY9M7Y7hcf1",
    "tbldeKGlLgRWSIzTh",
    "tbluN9YQjm0X3ju1n"
  ],
  "tbluN9YQjm0X3ju1n": [
    "tbl5x2jqUPHcAoKci"
  ],
  "tbl4GlNscZUI3XXwU": [
    "tbldBIfAeRAunipbk",
    "tbldeKGlLgRWSIzTh"
  ],
  "tbl5wqfJ8aEr3fFP7": [
    "tblMyUwA9bV97CIRC"
  ],
  "tblMyUwA9bV97CIRC": [
    "tbl5wqfJ8aEr3fFP7"
  ],
  "tblixAL658VYnMKOz": [
    "tbleikKz5Tt8tSc0J",
    "tblgd7iKw2KdPBkn2"
  ],
  "tblQ3hxcIEUQPLN6f": [
    "tbl9wvZY9M7Y7hcf1",
    "tblRBsPqSvzvAuSyY",
    "tblT6U9M9EFa4lKu0",
    "tbldBIfAeRAunipbk",
    "tbldeKGlLgRWSIzTh",
    "tblqhGm5GphLg982W",
    "tblyEBApY1hwIU19o"
  ],
  "tbl9wvZY9M7Y7hcf1": [
    "tbl0VEFw95zHBUK7s",
    "tbl1SGvoFaxkeMXfi",
    "tbl5x2jqUPHcAoKci",
    "tbl9wvZY9M7Y7hcf1",
    "tblBrtvazPOkXrB80",
    "tblIdtmSzkerb9xUS",
    "tblKfmzZ0LtndU0CO",
    "tblOoGvdG5TAb3xTn",
    "tblP55kxIOrh8O5Ut",
    "tblQ3hxcIEUQPLN6f",
    "tblRBsPqSvzvAuSyY",
    "tbldBIfAeRAunipbk",
    "tbldeKGlLgRWSIzTh",
    "tbleikKz5Tt8tSc0J",
    "tblgd7iKw2KdPBkn2",
    "tblhQ9jkgVAuG97gg",
    "tblhlUUpmLsGQfLPC",
    "tbliI4lRYA5AlpEzH",
    "tblpOwt2GB1YE2bm3",
    "tblqhGm5GphLg982W",
    "tblyEBApY1hwIU19o"
  ],
  "tbldZdb78jWBtMCJf": [
    "tbl8CwaqL8D612q3u"
  ],
  "tbl8CwaqL8D612q3u": [
    "tbldZdb78jWBtMCJf"
  ],
  "tblOoGvdG5TAb3xTn": [
    "tbl9wvZY9M7Y7hcf1",
    "tbldeKGlLgRWSIzTh"
  ],
  "tblqGfxK5hEksslVF": [
    "tbldeKGlLgRWSIzTh",
    "tblq1Sa3bCnP9QfAj"
  ],
  "tblKfmzZ0LtndU0CO": [
    "tbl9wvZY9M7Y7hcf1",
    "tblgd7iKw2KdPBkn2"
  ],
  "tblXOnnKNoozGPMLG": [],
  "tbllf6QE3WJTtadtN": [],
  "tblyEBApY1hwIU19o": [
    "tbl9wvZY9M7Y7hcf1",
    "tblQ3hxcIEUQPLN6f",
    "tbldBIfAeRAunipbk",
    "tblgd7iKw2KdPBkn2",
    "tblpOwt2GB1YE2bm3"
  ],
  "tblhlUUpmLsGQfLPC": [
    "tbl9wvZY9M7Y7hcf1",
    "tblpOwt2GB1YE2bm3"
  ],
  "tbliI4lRYA5AlpEzH": [
    "tbl9wvZY9M7Y7hcf1",
    "tbldBIfAeRAunipbk"
  ],
  "tblpRP3I6FrH7XQkY": [
    "tblVLxiBdOaWwyKA9"
  ],
  "tblVLxiBdOaWwyKA9": [
    "tblpRP3I6FrH7XQkY"
  ],
  "tblT6U9M9EFa4lKu0": [
    "tblQ3hxcIEUQPLN6f",
    "tbldBIfAeRAunipbk"
  ],
  "tblRBsPqSvzvAuSyY": [
    "tbl9wvZY9M7Y7hcf1",
    "tblIdtmSzkerb9xUS",
    "tblQ3hxcIEUQPLN6f",
    "tbldBIfAeRAunipbk",
    "tblgd7iKw2KdPBkn2"
  ],
  "tblIdtmSzkerb9xUS": [
    "tbl9wvZY9M7Y7hcf1",
    "tblRBsPqSvzvAuSyY"
  ]
};
